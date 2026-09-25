from api.accounts.views import LoginView
from django.contrib import admin
from django.urls import include, path

from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

schema_view = get_schema_view(
    openapi.Info(
        title="Perpetual Labs API",
        default_version="v1",
        description="API documentation",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="perpetual.ict@gmail.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # Home
    path("", include("api.home.urls")),

    # Accounts (register, profile, etc.)
    path("api/auth/", include("api.accounts.urls")),

    # Other app endpoints
    path("api/blog/", include("api.blog.urls")),
    path("api/services/", include("api.services.urls")),
    path("api/projects/", include("api.projects.urls")),
    path("api/testimonials/", include("api.testimonials.urls")),

    # JWT token endpoints
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/token/", LoginView.as_view(), name="get_token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh"),

    # Browsable API login/logout (optional)
    path("api-auth/", include("rest_framework.urls")),

    # Swagger / Redoc
    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="swagger-ui"),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="redoc-ui"),
    path("swagger.<format>/", schema_view.without_ui(cache_timeout=0), name="schema-json"),
]
