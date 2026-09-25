from rest_framework import serializers

from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "title", "description", "icon", "slug"]
        extra_kwargs = {
            "id": {"read_only": True},
            "slug": {"read_only": True},
        }
