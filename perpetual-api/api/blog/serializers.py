from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import BlogPost, NewsletterSubscriber


class BlogPostSerializer(serializers.ModelSerializer):
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
            "author",
            "category",
            "image",
            "slug",
        ]


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=NewsletterSubscriber.objects.all())]
    )

    class Meta:
        model = NewsletterSubscriber
        fields = ["email"]
