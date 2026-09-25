from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import BlogPost, NewsletterSubscriber
from .serializers import BlogPostSerializer, NewsletterSubscriberSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def blog_post_list(request):
    posts = BlogPost.objects.filter(is_published=True).order_by("-created_at")
    serializer = BlogPostSerializer(posts, many=True)
    return Response(serializer.data)


class NewsletterSubscriberViewSet(viewsets.ModelViewSet):
    queryset = NewsletterSubscriber.objects.all()
    serializer_class = NewsletterSubscriberSerializer
    permission_classes = [AllowAny]
    http_method_names = ["post"]

    def create(self, request, *args, **kwargs):
        email = request.data.get("email")
        subscriber, success, message = NewsletterSubscriber.subscribe(email)

        if success:
            serializer = self.get_serializer(subscriber)
            return Response(
                {"success": True, "message": message, "data": serializer.data},
                status=status.HTTP_201_CREATED,
            )
        else:
            return Response(
                {"success": False, "message": message},
                status=status.HTTP_400_BAD_REQUEST,
            )
