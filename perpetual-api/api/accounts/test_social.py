import hashlib
import secrets
from datetime import timedelta
from unittest.mock import Mock, patch
from urllib.parse import parse_qs, urlsplit

from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import SocialIdentity, SocialLoginAttempt, User
from .social import verified_claims


@override_settings(
    GOOGLE_CLIENT_ID="test-client",
    GOOGLE_CLIENT_SECRET="test-secret",
    GOOGLE_REDIRECT_URI="https://site.example/auth/google/callback",
)
class GoogleLoginTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.verifier = secrets.token_urlsafe(32)
        self.claims = {
            "sub": "google-user-1",
            "email": "person@example.test",
            "email_verified": True,
            "given_name": "Jane",
        }

    def start(self):
        response = self.client.post(
            "/api/auth/social/google/start/",
            {"challenge": hashlib.sha256(self.verifier.encode()).hexdigest()},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        state = parse_qs(urlsplit(response.data["url"]).query)["state"][0]
        return SocialLoginAttempt.objects.get(state=state), response

    def complete(self, attempt, **overrides):
        return self.client.post(
            "/api/auth/social/google/complete/",
            {
                "state": attempt.state,
                "verifier": self.verifier,
                "code": "provider-code",
                **overrides,
            },
            format="json",
        )

    @override_settings(
        DEBUG=True, GOOGLE_REDIRECT_URI="http://localhost:3000/auth/google/callback"
    )
    def test_development_callback_is_reported_and_used(self):
        status = self.client.get("/api/auth/social/google/")
        self.assertTrue(status.data["enabled"])
        attempt, response = self.start()
        self.assertEqual(
            parse_qs(urlsplit(response.data["url"]).query)["redirect_uri"],
            [status.data["redirect_uri"]],
        )

    def test_start_uses_pkce_nonce_and_fixed_callback(self):
        attempt, response = self.start()
        params = parse_qs(urlsplit(response.data["url"]).query)
        self.assertEqual(params["code_challenge_method"], ["S256"])
        self.assertEqual(params["nonce"], [attempt.nonce])
        self.assertEqual(
            params["redirect_uri"], ["https://site.example/auth/google/callback"]
        )
        self.assertNotIn("test-secret", response.data["url"])
        self.assertEqual(response["Cache-Control"], "no-store")

    @patch("api.accounts.social.verified_claims")
    def test_new_and_returning_google_user_receive_portal_session(self, verify):
        verify.return_value = self.claims
        attempt, _ = self.start()
        response = self.complete(attempt)
        self.assertEqual(response.status_code, 200, response.data)
        user = SocialIdentity.objects.get(subject=self.claims["sub"]).user
        self.assertFalse(user.has_usable_password())
        self.assertFalse(user.is_staff)
        self.assertEqual(user.notifications.count(), 1)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        self.assertEqual(self.client.get("/api/auth/portal/").status_code, 200)
        self.client.credentials()
        attempt, _ = self.start()
        self.assertEqual(self.complete(attempt).status_code, 200)
        self.assertEqual(SocialIdentity.objects.count(), 1)

    @patch("api.accounts.social.verified_claims")
    def test_replay_wrong_browser_and_expired_requests_are_rejected(self, verify):
        verify.return_value = self.claims
        attempt, _ = self.start()
        self.assertEqual(
            self.complete(attempt, verifier=secrets.token_urlsafe(32)).status_code, 400
        )
        verify.assert_not_called()
        self.assertEqual(self.complete(attempt).status_code, 200)
        self.assertEqual(self.complete(attempt).status_code, 400)
        self.assertEqual(verify.call_count, 1)
        attempt, _ = self.start()
        SocialLoginAttempt.objects.filter(pk=attempt.pk).update(
            expires_at=timezone.now() - timedelta(seconds=1)
        )
        self.assertEqual(self.complete(attempt).status_code, 400)
        self.assertEqual(verify.call_count, 1)

    @patch("api.accounts.social.verified_claims")
    def test_email_collision_does_not_link_or_elevate_account(self, verify):
        verify.return_value = self.claims
        existing = User.objects.create_user(
            username="existing", email="PERSON@example.test", is_staff=True
        )
        attempt, _ = self.start()
        response = self.complete(attempt)
        self.assertEqual(response.status_code, 409)
        self.assertEqual(SocialIdentity.objects.count(), 0)
        existing.refresh_from_db()
        self.assertTrue(existing.is_staff)

    @patch("api.accounts.social.verified_claims")
    def test_disabled_account_is_rejected(self, verify):
        verify.return_value = self.claims
        user = User.objects.create_user(
            username="disabled", email=self.claims["email"], is_active=False
        )
        SocialIdentity.objects.create(user=user, subject=self.claims["sub"])
        attempt, _ = self.start()
        self.assertEqual(self.complete(attempt).status_code, 403)

    @override_settings(GOOGLE_CLIENT_SECRET="")
    def test_unconfigured_provider_is_honest_and_fails_closed(self):
        self.assertFalse(self.client.get("/api/auth/social/google/").data["enabled"])
        self.assertEqual(
            self.client.post("/api/auth/social/google/start/", {}).status_code, 503
        )

    @patch("api.accounts.social.google_flow")
    @patch("api.accounts.social.id_token.verify_oauth2_token")
    def test_identity_verification_requires_nonce_verified_email_and_audience(
        self, verify, flow
    ):
        attempt = SocialLoginAttempt(
            state="state", nonce="expected", code_verifier="pkce"
        )
        flow.return_value.oauth2session.token = {"id_token": "signed-token"}
        claims = {**self.claims, "nonce": "expected"}
        verify.return_value = claims
        self.assertEqual(verified_claims(attempt, "code")["sub"], self.claims["sub"])
        self.assertEqual(verify.call_args.args[2], "test-client")
        flow.return_value.fetch_token.assert_called_with(
            code="code", timeout=10, allow_redirects=False
        )
        for invalid in [
            {"nonce": "wrong"},
            {"email_verified": False},
            {"azp": "attacker"},
            {"sub": ""},
        ]:
            verify.return_value = {**claims, **invalid}
            with self.assertRaises(ValueError):
                verified_claims(attempt, "code")

    @patch(
        "api.accounts.social.verified_claims",
        side_effect=ValueError("sensitive provider response"),
    )
    def test_provider_failures_do_not_leak_or_create_accounts(self, verify):
        attempt, _ = self.start()
        response = self.complete(attempt)
        self.assertEqual(response.status_code, 400)
        self.assertNotIn("sensitive", str(response.data))
        self.assertEqual(SocialIdentity.objects.count(), 0)

    def test_rate_limit(self):
        for _ in range(20):
            self.client.post("/api/auth/social/google/start/", {})
        self.assertEqual(
            self.client.post("/api/auth/social/google/start/", {}).status_code, 429
        )

    @patch("api.accounts.social.google_flow")
    @patch("api.accounts.social.BoundedGoogleRequest")
    def test_real_signed_token_verification_rejects_tampering_expiry_and_audience(
        self, transport, flow
    ):
        import json
        import time

        import jwt
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        from google.auth.exceptions import GoogleAuthError

        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        public = (
            key.public_key()
            .public_bytes(
                serialization.Encoding.PEM,
                serialization.PublicFormat.SubjectPublicKeyInfo,
            )
            .decode()
        )
        transport.return_value.return_value = Mock(
            status=200, data=json.dumps({"test-key": public}).encode()
        )
        now = int(time.time())
        claims = {
            **self.claims,
            "nonce": "expected",
            "iss": "https://accounts.google.com",
            "aud": "test-client",
            "iat": now,
            "exp": now + 300,
        }
        attempt = SocialLoginAttempt(nonce="expected", code_verifier="pkce")

        def token(values, signing_key=key):
            return jwt.encode(
                values, signing_key, algorithm="RS256", headers={"kid": "test-key"}
            )

        flow.return_value.oauth2session.token = {"id_token": token(claims)}
        self.assertEqual(verified_claims(attempt, "code")["sub"], self.claims["sub"])
        for override in [
            {"aud": "attacker"},
            {"exp": now - 60},
            {"iss": "https://attacker.example"},
        ]:
            flow.return_value.oauth2session.token = {
                "id_token": token({**claims, **override})
            }
            with self.assertRaises((ValueError, GoogleAuthError)):
                verified_claims(attempt, "code")
        other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        flow.return_value.oauth2session.token = {"id_token": token(claims, other)}
        with self.assertRaises((ValueError, GoogleAuthError)):
            verified_claims(attempt, "code")
