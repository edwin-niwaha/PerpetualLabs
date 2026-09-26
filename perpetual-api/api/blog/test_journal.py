from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import BlogPost


class JournalTests(APITestCase):
    def setUp(self):
        self.writer = get_user_model().objects.create_user(
            username="writer", email="writer@example.test", is_staff=True
        )
        self.client_user = get_user_model().objects.create_user(
            username="reader", email="reader@example.test"
        )
        self.payload = {
            "title": "A daily note",
            "excerpt": "A short introduction.",
            "content": "## Today\n\nA new idea.",
            "topic": "Studio notes",
            "is_published": False,
        }
        self.url = "/api/blog/journal/"

    def test_only_staff_can_read_drafts_or_write(self):
        self.assertEqual(self.client.get(self.url).status_code, 401)
        self.client.force_authenticate(self.client_user)
        self.assertEqual(self.client.get(self.url).status_code, 403)
        self.assertEqual(self.client.post(self.url, self.payload).status_code, 403)

    def test_draft_publish_edit_and_unpublish(self):
        self.client.force_authenticate(self.writer)
        draft = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(draft.status_code, 201, draft.data)
        self.assertEqual(self.client.get("/api/blog/blog-posts/").data, [])
        url = f"{self.url}{draft.data['id']}/"
        published = self.client.patch(url, {"is_published": True}, format="json")
        self.assertEqual(published.status_code, 200, published.data)
        self.assertIsNotNone(published.data["published_at"])
        self.assertEqual(len(self.client.get("/api/blog/blog-posts/").data), 1)
        edited = self.client.patch(
            url,
            {"title": "A better title", "author": self.client_user.pk},
            format="json",
        )
        self.assertEqual(edited.data["slug"], draft.data["slug"])
        self.assertEqual(BlogPost.objects.get(pk=draft.data["id"]).author, self.writer)
        self.client.patch(url, {"is_published": False}, format="json")
        self.assertEqual(self.client.get("/api/blog/blog-posts/").data, [])

    def test_scheduled_entries_are_private_until_due(self):
        self.client.force_authenticate(self.writer)
        response = self.client.post(
            self.url,
            {
                **self.payload,
                "is_published": True,
                "published_at": (timezone.now() + timedelta(days=1)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(self.client.get("/api/blog/blog-posts/").data, [])
        BlogPost.objects.filter(pk=response.data["id"]).update(
            published_at=timezone.now() - timedelta(seconds=1)
        )
        self.assertEqual(len(self.client.get("/api/blog/blog-posts/").data), 1)

    def test_repeated_titles_have_unique_stable_slugs_and_optional_images(self):
        self.client.force_authenticate(self.writer)
        one = self.client.post(self.url, self.payload, format="json")
        two = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(two.status_code, 201, two.data)
        self.assertNotEqual(one.data["slug"], two.data["slug"])
        self.assertEqual(two.data["image"], "")

    def test_invalid_content_and_unsafe_image_are_rejected(self):
        self.client.force_authenticate(self.writer)
        for override in [
            {"content": " "},
            {"title": "x" * 256},
            {"excerpt": "x" * 601},
            {"image": "http://internal.example/x.jpg"},
            {"published_at": "not-a-date"},
        ]:
            with self.subTest(override=override):
                self.assertEqual(
                    self.client.post(
                        self.url, {**self.payload, **override}, format="json"
                    ).status_code,
                    400,
                )
        self.assertEqual(BlogPost.objects.count(), 0)

    def test_cover_upload_failure_is_recoverable_and_does_not_save_entry(self):
        from io import BytesIO
        from unittest.mock import patch

        from cloudinary.exceptions import Error
        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image

        image = BytesIO()
        Image.new("RGB", (10, 10)).save(image, format="PNG")
        self.client.force_authenticate(self.writer)
        with patch(
            "cloudinary.uploader.upload", side_effect=Error("private provider details")
        ):
            response = self.client.post(
                self.url,
                {
                    **self.payload,
                    "cover_image": SimpleUploadedFile(
                        "cover.png", image.getvalue(), content_type="image/png"
                    ),
                },
                format="multipart",
            )
        self.assertEqual(response.status_code, 400)
        self.assertIn("cover_image", response.data)
        self.assertNotIn("private provider details", str(response.data))
        self.assertEqual(BlogPost.objects.count(), 0)
        retry = self.client.post(self.url, self.payload, format="json")
        self.assertEqual(retry.status_code, 201)

    def test_cover_upload_can_be_saved_and_published(self):
        from io import BytesIO
        from unittest.mock import patch

        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image

        image = BytesIO()
        Image.new("RGB", (10, 10)).save(image, format="PNG")
        self.client.force_authenticate(self.writer)
        with patch(
            "cloudinary.uploader.upload",
            return_value={"public_id": "media/journal/test-cover"},
        ) as upload:
            response = self.client.post(
                self.url,
                {
                    **self.payload,
                    "is_published": True,
                    "cover_image": SimpleUploadedFile(
                        "cover.png", image.getvalue(), content_type="image/png"
                    ),
                },
                format="multipart",
            )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(upload.call_args.kwargs["timeout"], 15)
        self.assertIn("test-cover", response.data["cover_image"])
        self.assertEqual(len(self.client.get("/api/blog/blog-posts/").data), 1)
