from rest_framework import serializers

from .models import FAQ, Feature, PageSection, SiteSettings


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = "__all__"
        read_only_fields = ["id", "updated_at"]


class PageSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageSection
        fields = "__all__"
        read_only_fields = ["id", "updated_at"]

    def validate_key(self, value):
        if self.instance and self.instance.key != value:
            raise serializers.ValidationError("The section key cannot be changed.")
        return value


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = "__all__"
        read_only_fields = ["id", "updated_at"]


class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = "__all__"
        read_only_fields = ["id", "updated_at"]
