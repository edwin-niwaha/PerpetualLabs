from rest_framework import serializers

from .models import Testimonial


class TestimonialSerializer(serializers.ModelSerializer):
    company = serializers.StringRelatedField(source="client", read_only=True)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.portrait:
            url = instance.portrait.url
            request = self.context.get("request")
            data["image"] = request.build_absolute_uri(url) if request else url
        return data

    class Meta:
        model = Testimonial
        fields = ["id", "name", "position", "client", "company", "content", "image"]
