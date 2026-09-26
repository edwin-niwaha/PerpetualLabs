"""Authenticated website content management and bounded raster uploads."""

from rest_framework import serializers
from rest_framework.permissions import IsAdminUser
from rest_framework.routers import DefaultRouter
from rest_framework.viewsets import ModelViewSet

from api.accounts.models import TeamMember
from api.accounts.serializers import TeamMemberSerializer
from api.images import RasterImageField
from api.projects.models import SiteVisual
from api.projects.serializers import SiteVisualSerializer
from api.services.models import Service
from api.services.serializers import ServiceSerializer
from api.testimonials.models import Testimonial
from api.testimonials.serializers import TestimonialSerializer


class TeamEditorSerializer(TeamMemberSerializer):
    portrait = RasterImageField(required=False, allow_null=True)
    remove_image = serializers.BooleanField(write_only=True, required=False)

    class Meta(TeamMemberSerializer.Meta):
        fields = [*TeamMemberSerializer.Meta.fields, "portrait", "remove_image"]

    def validate(self, attrs):
        if attrs.pop("remove_image", False):
            if attrs.get("portrait"):
                raise serializers.ValidationError(
                    "Choose either a new portrait or remove the picture."
                )
            attrs.update(portrait="", image="")
        return attrs


class TestimonialEditorSerializer(TestimonialSerializer):
    portrait = RasterImageField(required=False, allow_null=True)
    remove_image = serializers.BooleanField(write_only=True, required=False)

    class Meta(TestimonialSerializer.Meta):
        fields = [*TestimonialSerializer.Meta.fields, "portrait", "remove_image"]
        extra_kwargs = {"image": {"read_only": True}, "client": {"required": False}}

    def validate(self, attrs):
        if attrs.pop("remove_image", False):
            if attrs.get("portrait"):
                raise serializers.ValidationError(
                    "Choose either a new portrait or remove the picture."
                )
            attrs.update(portrait="", image="")
        return attrs


class VisualEditorSerializer(SiteVisualSerializer):
    image = RasterImageField()

    class Meta(SiteVisualSerializer.Meta):
        fields = ["id", *SiteVisualSerializer.Meta.fields]
        read_only_fields = ["id", "key"]


class StaffContentViewSet(ModelViewSet):
    permission_classes = [IsAdminUser]
    pagination_class = None
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]


class TeamEditorViewSet(StaffContentViewSet):
    queryset = TeamMember.objects.order_by("id")
    serializer_class = TeamEditorSerializer


class ServiceEditorViewSet(StaffContentViewSet):
    queryset = Service.objects.order_by("id")
    serializer_class = ServiceSerializer


class TestimonialEditorViewSet(StaffContentViewSet):
    queryset = Testimonial.objects.order_by("id")
    serializer_class = TestimonialEditorSerializer


class VisualEditorViewSet(StaffContentViewSet):
    queryset = SiteVisual.objects.order_by("key")
    serializer_class = VisualEditorSerializer
    http_method_names = ["get", "patch", "head", "options"]


router = DefaultRouter()
router.register("team", TeamEditorViewSet, basename="staff-team")
router.register("services", ServiceEditorViewSet, basename="staff-services")
router.register("testimonials", TestimonialEditorViewSet, basename="staff-testimonials")
router.register("visuals", VisualEditorViewSet, basename="staff-visuals")
