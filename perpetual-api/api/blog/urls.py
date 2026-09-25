from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views
from .views import NewsletterSubscriberViewSet

router = DefaultRouter()
router.register(
    r"subscribe", NewsletterSubscriberViewSet, basename="newsletter-subscriber"
)
# router.register(r'blog-posts', BlogPostViewSet, basename='blog-posts')

urlpatterns = [
    path("blog-posts/", views.blog_post_list, name="blog_post_list"),
    path("", include(router.urls)),
]
