from rest_framework import serializers

from api.images import RasterImageField

from .models import BlogPost, NewsletterSubscriber


class BlogPostSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.cover_image:
            url = instance.cover_image.url
            request = self.context.get("request")
            data["image"] = request.build_absolute_uri(url) if request else url
        return data

    category = serializers.StringRelatedField()
    author = serializers.StringRelatedField()

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "title",
            "excerpt",
            "content",
            "created_at",
            "published_at",
            "updated_at",
            "author",
            "category",
            "image",
            "slug",
        ]


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        max_length=254,
    )

    class Meta:
        model = NewsletterSubscriber
        fields = ["email"]


class JournalEditorSerializer(serializers.ModelSerializer):
    cover_image = RasterImageField(required=False, allow_null=True)
    remove_cover = serializers.BooleanField(write_only=True, required=False)

    def validate(self, attrs):
        if attrs.pop("remove_cover", False):
            if attrs.get("cover_image"):
                raise serializers.ValidationError(
                    "Choose either a replacement or remove the cover."
                )
            attrs.update(cover_image="", image="")
        return attrs

    publication_status = serializers.SerializerMethodField()

    def get_publication_status(self, instance):
        from django.utils import timezone

        if not instance.is_published:
            return "Draft"
        return (
            "Scheduled"
            if instance.published_at and instance.published_at > timezone.now()
            else "Published"
        )

    title = serializers.CharField(max_length=255)
    excerpt = serializers.CharField(max_length=600)
    content = serializers.CharField(max_length=80000)
    topic = serializers.CharField(max_length=100, required=False, allow_blank=True)
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "title",
            "excerpt",
            "content",
            "topic",
            "image",
            "cover_image",
            "remove_cover",
            "slug",
            "author",
            "is_published",
            "published_at",
            "updated_at",
            "publication_status",
        ]
        read_only_fields = ["id", "slug", "author", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["topic"] = instance.category.name if instance.category else ""
        return data

    def validate_image(self, value):
        from urllib.parse import urlsplit

        if value:
            url = urlsplit(value)
            if (
                url.scheme != "https"
                or url.hostname != "res.cloudinary.com"
                or url.username
                or url.password
            ):
                raise serializers.ValidationError(
                    "Use an HTTPS Cloudinary image URL, or leave this blank."
                )
        return value

    def _topic(self, validated_data):
        from .models import Category

        if "topic" in validated_data:
            name = validated_data.pop("topic").strip()
            category = (
                Category.objects.filter(name__iexact=name).first() if name else None
            )
            if name and category is None:
                category, _ = Category.objects.get_or_create(name=name)
            validated_data["category"] = category

    def create(self, validated_data):
        self._topic(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        self._topic(validated_data)
        return super().update(instance, validated_data)
