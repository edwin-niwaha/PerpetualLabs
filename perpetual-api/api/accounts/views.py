from django.contrib.auth import get_user_model
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Contact, TeamMember
from .serializers import ContactSerializer, TeamMemberSerializer, UserSerializer, ProfileSerializer


class LoginView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class CreateUserView(generics.CreateAPIView):
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "registration"


class ProfileView(generics.RetrieveUpdateAPIView):
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
        contact = serializer.save()
        return Response({
            "success": True,
            "message": "Thanks for reaching out. Your message has been received.",
            "data": ContactSerializer(contact).data,
        }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([AllowAny])
def team_member_list(request):
    serializer = TeamMemberSerializer(TeamMember.objects.all(), many=True)
    return Response(serializer.data)
