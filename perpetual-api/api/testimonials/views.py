from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Testimonial
from .serializers import TestimonialSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def testimonials_list(request):
    testimonies = Testimonial.objects.all().order_by("-created_at")
    serializer = TestimonialSerializer(testimonies, many=True)
    return Response(serializer.data)
