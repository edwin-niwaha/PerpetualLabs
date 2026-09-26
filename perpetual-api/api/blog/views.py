from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import BlogPost, NewsletterSubscriber
from .serializers import BlogPostSerializer, NewsletterSubscriberSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def blog_post_list(request):
    posts = (
        BlogPost.objects.filter(is_published=True)
        .filter(Q(published_at__lte=timezone.now()) | Q(published_at__isnull=True))
        .select_related("author", "category")
        .order_by("-published_at", "-created_at")
    )
    serializer = BlogPostSerializer(posts, many=True, context={"request": request})
    return Response(serializer.data)


class NewsletterSubscriberViewSet(viewsets.ModelViewSet):
    queryset = NewsletterSubscriber.objects.all()
    serializer_class = NewsletterSubscriberSerializer
    permission_classes = [AllowAny]
    http_method_names = ["post"]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "newsletter"

    def create(self, request, *args, **kwargs):
        input_serializer = self.get_serializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        email = input_serializer.validated_data["email"]
        _, _, message = NewsletterSubscriber.subscribe(email)
        return Response(
            {"success": True, "message": message},
            status=status.HTTP_201_CREATED,
        )


class JournalEditorViewSet(viewsets.ModelViewSet):
    from .serializers import JournalEditorSerializer

    serializer_class = JournalEditorSerializer
    permission_classes = [IsAdminUser]
    queryset = BlogPost.objects.select_related("author", "category").order_by(
        "-updated_at"
    )
    http_method_names = ["get", "post", "patch", "head", "options"]

    def _save(self, serializer, **kwargs):
        from cloudinary.exceptions import Error as CloudinaryError
        from django.db import transaction
        from rest_framework.exceptions import ValidationError

        try:
            with transaction.atomic():
                serializer.save(**kwargs)
        except (CloudinaryError, OSError):
            raise ValidationError(
                {
                    "cover_image": [
                        "The cover image could not be uploaded. Try a smaller image, or save without a cover and add it later."
                    ]
                }
            ) from None

    def perform_create(self, serializer):
        self._save(serializer, author=self.request.user)

    def perform_update(self, serializer):
        self._save(serializer)
