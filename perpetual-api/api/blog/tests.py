from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import BlogPost, Category


class PublishedContentTests(APITestCase):
    def test_public_listing_excludes_drafts(self):
        author = get_user_model().objects.create_user(
            username="writer",
            email="writer@example.test",
            password="Test-Writer!84-Password",
        )
        category = Category.objects.create(name="Test category", slug="test-category")
        for published, slug in [(True, "published-note"), (False, "private-draft")]:
            BlogPost.objects.create(
                title=slug,
                slug=slug,
                excerpt="A test excerpt.",
                content="Test article body.",
                author=author,
                category=category,
                image="https://example.com/image.jpg",
                is_published=published,
            )
        response = self.client.get("/api/blog/blog-posts/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["slug"] for item in response.data], ["published-note"])


class NewsletterSubmissionTests(APITestCase):
    def setUp(self):
        from django.core.cache import cache

        cache.clear()

    def test_invalid_email_is_not_saved_or_mailed(self):
        from unittest.mock import patch

        from .models import NewsletterSubscriber

        with patch.object(NewsletterSubscriber, "send_subscription_email") as send:
            for email in [
                "not-an-email",
                "<script>alert(1)</script>",
                "x" * 255 + "@example.com",
            ]:
                response = self.client.post("/api/blog/subscribe/", {"email": email})
                self.assertEqual(response.status_code, 400)
            self.assertEqual(NewsletterSubscriber.objects.count(), 0)
            send.assert_not_called()

    def test_valid_subscription_and_private_collection(self):
        from unittest.mock import patch

        from .models import NewsletterSubscriber

        with patch.object(NewsletterSubscriber, "send_subscription_email") as send:
            payload = {"email": "newsletter@example.test"}
            with self.captureOnCommitCallbacks(execute=True):
                first = self.client.post("/api/blog/subscribe/", payload)
                duplicate = self.client.post("/api/blog/subscribe/", payload)
            self.assertEqual(first.status_code, 201)
            self.assertEqual(duplicate.status_code, first.status_code)
            self.assertEqual(first.data, duplicate.data)
            self.assertEqual(NewsletterSubscriber.objects.count(), 1)
            send.assert_called_once()
        self.assertEqual(self.client.get("/api/blog/subscribe/").status_code, 405)

    def test_subscription_attempts_are_throttled(self):
        for _ in range(10):
            self.assertEqual(
                self.client.post("/api/blog/subscribe/", {}).status_code, 400
            )
        self.assertEqual(self.client.post("/api/blog/subscribe/", {}).status_code, 429)
