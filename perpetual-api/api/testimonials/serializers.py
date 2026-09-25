from rest_framework import serializers

from .models import Testimonial


class TestimonialSerializer(serializers.ModelSerializer):
    company = serializers.StringRelatedField(source="client", read_only=True)

    class Meta:
        model = Testimonial
        fields = ["id", "name", "position", "client", "company", "content", "image"]
