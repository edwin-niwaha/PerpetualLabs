"""Bound expensive password and token parsing before authentication."""

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.utils import get_md5_hash_password


class LoginSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields[self.username_field] = serializers.CharField(max_length=150)
        self.fields["password"] = serializers.CharField(
            max_length=128, trim_whitespace=False, write_only=True
        )


class RefreshSerializer(TokenRefreshSerializer):
    refresh = serializers.CharField(max_length=4096, trim_whitespace=False)

    def validate(self, attrs):
        # The installed SimpleJWT refresh serializer does not check revocation.
        token = self.token_class(attrs["refresh"])
        user = (
            get_user_model()
            .objects.filter(pk=token.get(api_settings.USER_ID_CLAIM), is_active=True)
            .first()
        )
        if not user or token.get(
            api_settings.REVOKE_TOKEN_CLAIM
        ) != get_md5_hash_password(user.password):
            raise AuthenticationFailed("Your session has ended. Please sign in again.")
        return super().validate(attrs)
