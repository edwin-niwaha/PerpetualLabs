"""Self-service account mutations; identifiers never select another user's profile."""

import hashlib
import logging

from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils.decorators import method_decorator
from django.utils.http import urlsafe_base64_decode
from django.views.decorators.debug import sensitive_post_parameters, sensitive_variables
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics, serializers, status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle, SimpleRateThrottle

from api.images import RasterImageField

from .password_reset_mail import queue_password_reset
from .serializers import ProfileSerializer

User = get_user_model()
logger = logging.getLogger(__name__)
RESET_MESSAGE = "If an eligible account exists, a password-reset link will be sent to its email address."
INVALID_RESET = (
    "This password-reset link is invalid or has expired. Request a new link."
)


class MessageSerializer(serializers.Serializer):
    message = serializers.CharField(read_only=True)


class ForgotPasswordSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)


class PasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(
        max_length=128, trim_whitespace=False, write_only=True
    )
    confirm_password = serializers.CharField(
        max_length=128, trim_whitespace=False, write_only=True
    )

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


class ResetPasswordSerializer(PasswordSerializer):
    uid = serializers.CharField(max_length=128, write_only=True)
    token = serializers.CharField(max_length=128, write_only=True)


class ChangePasswordSerializer(PasswordSerializer):
    current_password = serializers.CharField(
        max_length=128, trim_whitespace=False, write_only=True
    )


class PictureSerializer(serializers.Serializer):
    profile_picture = RasterImageField()


class ResetAccountThrottle(SimpleRateThrottle):
    scope = "password_reset_account"

    def get_cache_key(self, request, view):
        if not hasattr(request.data, "get"):
            return None
        identifier = request.data.get("username", "")
        if not isinstance(identifier, str):
            return None
        # Never place usernames or emails in cache keys.
        digest = hashlib.sha256(identifier.strip().casefold().encode()).hexdigest()
        return self.cache_format % {"scope": self.scope, "ident": digest}


@sensitive_variables()
def replace_password(user, password, error):
    try:
        password_validation.validate_password(password, user)
    except DjangoValidationError as exc:
        raise ValidationError({"new_password": exc.messages}) from None
    if user.check_password(password):
        raise ValidationError(
            {
                "new_password": [
                    "Choose a different password from your current password."
                ]
            }
        )
    previous = user.password
    user.set_password(password)
    # Compare-and-swap makes even simultaneous reset requests single-use on SQLite
    # and PostgreSQL, and prevents an in-flight change overwriting a newer password.
    if (
        User.objects.filter(pk=user.pk, password=previous, is_active=True).update(
            password=user.password
        )
        != 1
    ):
        raise ValidationError(error)
    password_validation.password_changed(password, user)


@method_decorator(sensitive_post_parameters(), name="dispatch")
class ForgotPasswordView(generics.GenericAPIView):
    serializer_class = ForgotPasswordSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle, ResetAccountThrottle]
    throttle_scope = "password_reset_request"

    @swagger_auto_schema(responses={200: MessageSerializer})
    @sensitive_variables()
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not queue_password_reset(serializer.validated_data["username"]):
            return Response(
                {"detail": "Please try again shortly."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({"message": RESET_MESSAGE})


@method_decorator(sensitive_post_parameters(), name="dispatch")
class ResetPasswordView(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset_confirm"

    @swagger_auto_schema(responses={200: MessageSerializer})
    @sensitive_variables()
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            uid = urlsafe_base64_decode(data["uid"]).decode()
            user = User.objects.filter(pk=uid, is_active=True).first()
        except (ValueError, TypeError, OverflowError, UnicodeDecodeError):
            user = None
        if (
            not user
            or not user.has_usable_password()
            or not default_token_generator.check_token(user, data["token"])
        ):
            raise ValidationError({"detail": INVALID_RESET})
        replace_password(user, data["new_password"], {"detail": INVALID_RESET})
        return Response(
            {"message": "Your password has been reset. Please sign in again."}
        )


@method_decorator(sensitive_post_parameters(), name="dispatch")
class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_change"

    @swagger_auto_schema(responses={200: MessageSerializer})
    @sensitive_variables()
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = request.user
        if not user.check_password(data["current_password"]):
            raise ValidationError(
                {"current_password": ["Current password is incorrect."]}
            )
        replace_password(
            user,
            data["new_password"],
            {
                "detail": "Your password changed during this request. Please sign in again."
            },
        )
        return Response(
            {"message": "Your password has been changed. Please sign in again."}
        )


def delete_picture(storage, name):
    if name:
        try:
            storage.delete(name)
        except Exception:
            logger.warning(
                "An obsolete profile picture could not be deleted from storage."
            )


class ProfilePictureView(generics.GenericAPIView):
    serializer_class = PictureSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "profile_picture"

    @swagger_auto_schema(responses={200: ProfileSerializer})
    def put(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return self.save_picture(request, serializer.validated_data["profile_picture"])

    @swagger_auto_schema(responses={204: "Profile picture removed"})
    def delete(self, request):
        self.save_picture(request, "")
        return Response(status=status.HTTP_204_NO_CONTENT)

    def save_picture(self, request, picture):
        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=request.user.pk)
            old_name = user.profile_picture.name
            storage = user.profile_picture.storage
            user.profile_picture = picture
            user.save(update_fields=["profile_picture"])
            transaction.on_commit(lambda: delete_picture(storage, old_name))
        return Response(ProfileSerializer(user, context={"request": request}).data)
