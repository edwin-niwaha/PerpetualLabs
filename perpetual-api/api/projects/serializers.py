from rest_framework import serializers

from .models import Project, Product


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "description",
            "detail",
            "client",
            "completion_date",
            "technologies",
            "category",
            "website_url",
            "image",
            "slug",
            "created_at",
        ]
        extra_kwargs = {"id": {"read_only": True}, "slug": {"read_only": True}}


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'image']
