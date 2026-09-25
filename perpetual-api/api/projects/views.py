from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Project, Product
from .serializers import ProjectSerializer, ProductSerializer



@api_view(["GET"])
@permission_classes([AllowAny])
def project_list(request):
    projects = Project.objects.all().order_by("-completion_date")
    serializer = ProjectSerializer(projects, many=True)
    return Response(serializer.data)


@permission_classes([AllowAny])
class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer