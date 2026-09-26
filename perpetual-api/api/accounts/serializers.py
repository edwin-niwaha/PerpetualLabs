from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers

from .models import Contact, TeamMember

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "date_of_birth",
            "bio",
            "password",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "password": {"write_only": True, "max_length": 128},
            "bio": {"max_length": 2000},
        }

    def validate(self, attrs):
        candidate = User(
            **{key: value for key, value in attrs.items() if key != "password"}
        )
        validate_password(attrs.get("password", ""), candidate)
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "bio",
            "is_staff",
            "date_of_birth",
            "profile_picture",
        ]
        read_only_fields = ["id", "username", "email", "is_staff", "profile_picture"]
        extra_kwargs = {"bio": {"max_length": 2000}}

    def update(self, instance, validated_data):
        # Save only permitted submitted columns; never write back a stale password.
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if validated_data:
            instance.save(update_fields=list(validated_data))
        return instance

    def validate_date_of_birth(self, value):
        if value and value > timezone.localdate():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value


class ContactSerializer(serializers.ModelSerializer):
    user_message = serializers.CharField(min_length=10, max_length=5000)

    class Meta:
        model = Contact
        fields = ["id", "name", "email", "user_message", "created_at"]
        read_only_fields = ["id", "created_at"]


class TeamMemberSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    def get_image(self, member):
        url = member.portrait.url if member.portrait else member.image
        request = self.context.get("request")
        return request.build_absolute_uri(url) if url and request else url

    class Meta:
        model = TeamMember
        fields = ["id", "name", "position", "image"]
        read_only_fields = ["id"]
