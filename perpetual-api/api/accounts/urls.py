from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ContactViewSet, CreateUserView, ProfileView, team_member_list

# Create a router instance and register the ContactViewSet
router = DefaultRouter()
router.register(r"contacts", ContactViewSet, basename="contact")

urlpatterns = [
    path("profile/", ProfileView.as_view(), name="profile"),
    path("", include(router.urls)),
    path("register/", CreateUserView.as_view(), name="register"),
    path("team-members/list/", team_member_list, name="team-member"),
]
