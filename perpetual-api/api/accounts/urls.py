from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .account_management import (
    ChangePasswordView,
    ForgotPasswordView,
    ProfilePictureView,
    ResetPasswordView,
)
from .portal import PortalView, ReadNotificationView
from .social import GoogleComplete, GoogleStart, GoogleStatus
from .views import ContactViewSet, CreateUserView, ProfileView, team_member_list

# Create a router instance and register the ContactViewSet
router = DefaultRouter()
router.register(r"contacts", ContactViewSet, basename="contact")

urlpatterns = [
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("profile/picture/", ProfilePictureView.as_view(), name="profile-picture"),
    path("social/google/", GoogleStatus.as_view()),
    path("social/google/start/", GoogleStart.as_view()),
    path("social/google/complete/", GoogleComplete.as_view()),
    path("portal/", PortalView.as_view(), name="client-portal"),
    path(
        "notifications/<int:pk>/",
        ReadNotificationView.as_view(),
        name="read-notification",
    ),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("", include(router.urls)),
    path("register/", CreateUserView.as_view(), name="register"),
    path("team-members/list/", team_member_list, name="team-member"),
]
