"""Google authorization code login, bound to a short-lived browser verifier."""

import hashlib
import secrets
from datetime import timedelta
from urllib.parse import urlsplit

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.utils import timezone
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
from oauthlib.oauth2 import OAuth2Error
from requests.exceptions import RequestException
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import PortalNotification, SocialIdentity, SocialLoginAttempt, User


def configured():
    url = urlsplit(settings.GOOGLE_REDIRECT_URI)
    secure = url.scheme == "https" or (
        settings.DEBUG
        and url.scheme == "http"
        and url.hostname in {"localhost", "127.0.0.1"}
    )
    return bool(
        settings.GOOGLE_CLIENT_ID
        and settings.GOOGLE_CLIENT_SECRET
        and secure
        and url.netloc
        and not url.username
        and not url.password
        and not url.query
        and not url.fragment
        and url.path == "/auth/google/callback"
    )


def google_flow(attempt):
    return Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/v2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=[
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ],
        state=attempt.state,
        code_verifier=attempt.code_verifier,
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )


class BoundedGoogleRequest(Request):
    def __call__(self, *args, **kwargs):
        kwargs["timeout"] = 10
        kwargs["allow_redirects"] = False
        return super().__call__(*args, **kwargs)


def verified_claims(attempt, code):
    flow = google_flow(attempt)
    flow.fetch_token(code=code, timeout=10, allow_redirects=False)
    token = flow.oauth2session.token.get("id_token")
    if not token:
        raise ValueError("Missing ID token")
    claims = id_token.verify_oauth2_token(
        token, BoundedGoogleRequest(), settings.GOOGLE_CLIENT_ID
    )
    if (
        not secrets.compare_digest(
            str(claims.get("nonce", "")).encode(), attempt.nonce.encode()
        )
        or claims.get("email_verified") is not True
        or not isinstance(claims.get("sub"), str)
        or not 1 <= len(claims["sub"]) <= 255
        or claims.get("azp", settings.GOOGLE_CLIENT_ID) != settings.GOOGLE_CLIENT_ID
    ):
        raise ValueError("Invalid identity")
    email = str(claims.get("email", "")).strip().lower()
    validate_email(email)
    if len(email) > 254:
        raise ValueError("Invalid email")
    claims["email"] = email
    return claims


class SocialBase(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "social_login"

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "no-store"
        return response


class GoogleStatus(SocialBase):
    throttle_classes = []

    def get(self, request):
        return Response(
            {"enabled": configured(), "redirect_uri": settings.GOOGLE_REDIRECT_URI}
        )


class StartInput(serializers.Serializer):
    challenge = serializers.RegexField(r"^[a-f0-9]{64}$")


class CompleteInput(serializers.Serializer):
    state = serializers.RegexField(r"^[A-Za-z0-9_-]{43}$")
    verifier = serializers.RegexField(r"^[A-Za-z0-9_-]{43}$")
    code = serializers.CharField(max_length=4096, trim_whitespace=False)


class GoogleStart(SocialBase):
    def post(self, request):
        if not configured():
            return Response({"detail": "Google sign-in is not configured."}, status=503)
        data = StartInput(data=request.data)
        data.is_valid(raise_exception=True)
        # Bounded retention: expired attempts are never reusable.
        SocialLoginAttempt.objects.filter(expires_at__lt=timezone.now()).delete()
        attempt = SocialLoginAttempt.objects.create(
            state=secrets.token_urlsafe(32),
            nonce=secrets.token_urlsafe(32),
            code_verifier=secrets.token_urlsafe(48),
            browser_challenge=data.validated_data["challenge"],
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        url, _ = google_flow(attempt).authorization_url(
            nonce=attempt.nonce, access_type="online", prompt="select_account"
        )
        return Response({"url": url})


class GoogleComplete(SocialBase):
    def post(self, request):
        if not configured():
            return Response({"detail": "Google sign-in is not configured."}, status=503)
        data = CompleteInput(data=request.data)
        data.is_valid(raise_exception=True)
        values = data.validated_data
        challenge = hashlib.sha256(values["verifier"].encode()).hexdigest()
        candidates = SocialLoginAttempt.objects.filter(
            state=values["state"],
            browser_challenge=challenge,
            consumed=False,
            expires_at__gt=timezone.now(),
        )
        # Atomic claim prevents concurrent callback replay, also on SQLite.
        attempt = candidates.first()
        if attempt is None or candidates.update(consumed=True) != 1:
            return Response(
                {"detail": "This sign-in request expired. Please start again."},
                status=400,
            )
        try:
            claims = verified_claims(attempt, values["code"])
            with transaction.atomic():
                identity = (
                    SocialIdentity.objects.select_related("user")
                    .filter(provider="google", subject=claims["sub"])
                    .first()
                )
                if identity:
                    user = identity.user
                    if not user.is_active:
                        return Response({"detail": "Unable to sign in."}, status=403)
                else:
                    # Never silently link by email, even a verified provider email.
                    if User.objects.filter(email__iexact=claims["email"]).exists():
                        return Response(
                            {
                                "detail": "Use your existing account password to sign in.",
                                "code": "existing_account",
                            },
                            status=409,
                        )
                    user = User.objects.create_user(
                        username="google_" + secrets.token_hex(16),
                        email=claims["email"],
                        password=None,
                        first_name=str(claims.get("given_name", ""))[:50],
                        last_name=str(claims.get("family_name", ""))[:50],
                    )
                    SocialIdentity.objects.create(
                        user=user, provider="google", subject=claims["sub"]
                    )
                    PortalNotification.objects.create(
                        user=user,
                        title="Welcome to your client portal",
                        body="Your Perpetual Labs account is ready. Your notifications and service updates will appear here.",
                        email_requested=False,
                    )
            tokens = RefreshToken.for_user(user)
            return Response(
                {
                    "access": str(tokens.access_token),
                    "refresh": str(tokens),
                    "is_staff": user.is_staff,
                }
            )
        except (
            ValueError,
            ValidationError,
            GoogleAuthError,
            OAuth2Error,
            RequestException,
            IntegrityError,
        ):
            # Provider payloads can contain credentials: never return or log them.
            return Response(
                {"detail": "Google sign-in could not be completed. Please try again."},
                status=400,
            )
