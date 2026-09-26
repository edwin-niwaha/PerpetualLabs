from django.contrib.auth import get_user_model
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Contact, TeamMember
from .serializers import (
    ContactSerializer,
    ProfileSerializer,
    TeamMemberSerializer,
    UserSerializer,
)
from .token_serializers import LoginSerializer, RefreshSerializer


class RefreshView(TokenRefreshView):
    serializer_class = RefreshSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "token_refresh"


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class CreateUserView(generics.CreateAPIView):
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "registration"

    def perform_create(self, serializer):
        from .models import PortalNotification

        user = serializer.save()
        PortalNotification.objects.create(
            user=user,
            title="Welcome to your client portal",
            body="Your Perpetual Labs account is ready. Find notifications, email updates, and upcoming services here.",
            email_requested=True,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "profile"
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return self.request.user


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"

    def get_permissions(self):
        return [AllowAny()] if self.action == "create" else [IsAdminUser()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contact = serializer.save(
            user=request.user if request.user.is_authenticated else None
        )
        statuses = list(contact.email_deliveries.values_list("status", flat=True))
        emails_accepted = len(statuses) == 2 and all(
            value == "accepted" for value in statuses
        )
        return Response(
            {
                "success": True,
                "message": (
                    "Your inquiry is saved. Both notification emails were accepted for delivery. Check your inbox and spam folder."
                    if emails_accepted
                    else "Your inquiry is saved, but one or both email notifications could not be sent yet. Our team can retry them; please do not submit the same inquiry again."
                ),
                "email_status": "accepted" if emails_accepted else "pending",
                "data": ContactSerializer(contact).data,
            },
            status=status.HTTP_201_CREATED,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def team_member_list(request):
    serializer = TeamMemberSerializer(
        TeamMember.objects.order_by("id"), many=True, context={"request": request}
    )
    return Response(serializer.data)
