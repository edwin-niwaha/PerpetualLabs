from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from .models import BlogPost, Category


class PublishedContentTests(APITestCase):
    def test_public_listing_excludes_drafts(self):
        author = get_user_model().objects.create_user(username="writer", email="writer@example.test", password="Test-Writer!84-Password")
        category = Category.objects.create(name="Test category", slug="test-category")
        for published, slug in [(True, "published-note"), (False, "private-draft")]:
            BlogPost.objects.create(title=slug, slug=slug, excerpt="A test excerpt.", content="Test article body.", author=author, category=category, image="https://example.com/image.jpg", is_published=published)
        response = self.client.get("/api/blog/blog-posts/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["slug"] for item in response.data], ["published-note"])
