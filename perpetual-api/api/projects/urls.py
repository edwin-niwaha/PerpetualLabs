
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, project_list

# Initialize the router and register viewsets
router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')

# Define URL patterns
urlpatterns = [
    path("list/", project_list, name="project-list"),
    path("", include(router.urls)),
]
