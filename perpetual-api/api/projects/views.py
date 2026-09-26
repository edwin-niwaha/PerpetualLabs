from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from api.viewsets import PublishedContentViewSet

from .models import Product, Project, SiteVisual
from .serializers import ProductSerializer, ProjectSerializer, SiteVisualSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def project_list(request):
    projects = Project.objects.all().order_by("-completion_date")
    return Response(ProjectSerializer(projects, many=True).data)


class ProductViewSet(PublishedContentViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.order_by("sort_order", "name")


class SiteVisualViewSet(ReadOnlyModelViewSet):
    queryset = SiteVisual.objects.all()
    serializer_class = SiteVisualSerializer
    permission_classes = [AllowAny]
    lookup_field = "key"
