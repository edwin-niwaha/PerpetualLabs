from rest_framework import serializers

from api.images import RasterImageField

from .models import Product, Project, SiteVisual


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
    image = RasterImageField(required=False, allow_null=True)

    completion_date = serializers.DateField(read_only=True, default=None)
    technologies = serializers.ListField(read_only=True, default=list)
    title = serializers.CharField(source="name", read_only=True)
    project_type = serializers.CharField(source="category", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "title",
            "slug",
            "description",
            "detail",
            "image",
            "image_alt",
            "category",
            "project_type",
            "website_url",
            "status",
            "focus",
            "is_featured",
            "is_published",
            "sort_order",
            "completion_date",
            "technologies",
        ]
        read_only_fields = ["id", "slug"]

    def validate_focus(self, value):
        if (
            not isinstance(value, list)
            or len(value) > 12
            or any(
                not isinstance(v, str) or not v.strip() or len(v) > 120 for v in value
            )
        ):
            raise serializers.ValidationError("Use up to 12 short text features.")
        return value

    def validate_website_url(self, value):
        if value and not value.startswith("https://"):
            raise serializers.ValidationError("Use an HTTPS website address.")
        return value

    def validate_image(self, value):
        if value and value.size > 8 * 1024 * 1024:
            raise serializers.ValidationError("Images must be 8 MB or smaller.")
        return value


class SiteVisualSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteVisual
        fields = ["key", "image", "alt", "credit", "source_url"]
