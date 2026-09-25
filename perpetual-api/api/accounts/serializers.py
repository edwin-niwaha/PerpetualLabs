from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import Contact, TeamMember

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "date_of_birth", "bio", "password"]
        read_only_fields = ["id"]
        extra_kwargs = {"password": {"write_only": True}, "bio": {"max_length": 2000}}

    def validate(self, attrs):
        candidate = User(**{key: value for key, value in attrs.items() if key != "password"})
        validate_password(attrs.get("password", ""), candidate)
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "bio"]
        read_only_fields = ["id", "username", "email"]
        extra_kwargs = {"bio": {"max_length": 2000}}


class ContactSerializer(serializers.ModelSerializer):
    user_message = serializers.CharField(min_length=10, max_length=5000)

    class Meta:
        model = Contact
        fields = ["id", "name", "email", "user_message", "created_at"]
        read_only_fields = ["id", "created_at"]


class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = ["id", "name", "position", "image"]
        read_only_fields = ["id"]
