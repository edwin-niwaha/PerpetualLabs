from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ProductViewSet, SiteVisualViewSet, project_list

# Initialize the router and register viewsets
router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")

router.register(r"visuals", SiteVisualViewSet, basename="visual")

# Define URL patterns
urlpatterns = [
    path("list/", project_list, name="project-list"),
    path("", include(router.urls)),
]
