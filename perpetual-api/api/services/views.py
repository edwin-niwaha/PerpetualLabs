from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Service
from .serializers import ServiceSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def service_list(request):
    services = Service.objects.all().order_by("-created_at")
    serializer = ServiceSerializer(services, many=True)
    return Response(serializer.data)
