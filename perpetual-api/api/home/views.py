from django.views.generic import TemplateView
from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from api.permissions import StaffWritePermission
from api.viewsets import PublishedContentViewSet

from .models import FAQ, Feature, PageSection, SiteSettings
from .serializers import (
    FAQSerializer,
    FeatureSerializer,
    PageSectionSerializer,
    SiteSettingsSerializer,
)


class HomeView(TemplateView):
    template_name = "home/home.html"


class SiteSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = SiteSettingsSerializer
    permission_classes = [StaffWritePermission]
    queryset = SiteSettings.objects.all()

    def get_object(self):
        self.kwargs["pk"] = 1
        return super().get_object()


class PageSectionViewSet(viewsets.ModelViewSet):
    queryset = PageSection.objects.all()
    serializer_class = PageSectionSerializer
    permission_classes = [StaffWritePermission]
    http_method_names = ["get", "post", "patch", "head", "options"]


class FAQViewSet(PublishedContentViewSet):
    queryset = FAQ.objects.all()
    serializer_class = FAQSerializer


class FeatureViewSet(PublishedContentViewSet):
    queryset = Feature.objects.all()
    serializer_class = FeatureSerializer


class WebsiteContentView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        settings = SiteSettings.objects.filter(pk=1).first()
        return Response(
            {
                "settings": SiteSettingsSerializer(settings).data if settings else None,
                "sections": PageSectionSerializer(
                    PageSection.objects.all(), many=True
                ).data,
                "faqs": FAQSerializer(
                    FAQ.objects.filter(is_published=True), many=True
                ).data,
                "features": FeatureSerializer(
                    Feature.objects.filter(is_published=True), many=True
                ).data,
            }
        )
