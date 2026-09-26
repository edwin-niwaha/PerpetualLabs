from rest_framework import serializers

from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    def validate_highlights(self, value):
        if (
            not isinstance(value, list)
            or len(value) > 12
            or any(
                not isinstance(item, str) or not item.strip() or len(item) > 120
                for item in value
            )
        ):
            raise serializers.ValidationError("Use up to 12 short text highlights.")
        return value

    class Meta:
        model = Service
        fields = ["id", "title", "description", "icon", "slug", "highlights"]
        extra_kwargs = {
            "id": {"read_only": True},
            "slug": {"read_only": True},
        }
