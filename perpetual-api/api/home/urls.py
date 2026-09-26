from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    FAQViewSet,
    FeatureViewSet,
    HomeView,
    PageSectionViewSet,
    SiteSettingsView,
    WebsiteContentView,
)

router = DefaultRouter()
router.register("sections", PageSectionViewSet)
router.register("faqs", FAQViewSet)
router.register("features", FeatureViewSet)
urlpatterns = [
    path("", HomeView.as_view(), name="api-home"),
    path("api/content/", WebsiteContentView.as_view(), name="website-content"),
    path("api/content/settings/", SiteSettingsView.as_view(), name="site-settings"),
    path("api/content/", include(router.urls)),
]
