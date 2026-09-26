import tempfile
from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from api.accounts.models import TeamMember
from api.projects.models import Product


def picture():
    data = BytesIO()
    Image.new("RGB", (20, 20), "red").save(data, format="PNG")
    return SimpleUploadedFile("portrait.png", data.getvalue(), content_type="image/png")


class StaffContentTests(TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.settings_override = override_settings(
            MEDIA_ROOT=self.directory.name,
            STORAGES={
                "staticfiles": {
                    "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
                },
                "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
            },
        )
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.staff = get_user_model().objects.create_user(
            username="content-staff", email="staff@example.test", is_staff=True
        )
        self.member = get_user_model().objects.create_user(
            username="content-member", email="member@example.test"
        )
        self.client = APIClient()
        self.client.force_authenticate(self.staff)

    def test_management_requires_staff(self):
        for user in (None, self.member):
            self.client.force_authenticate(user)
            for kind in ("team", "services", "testimonials", "visuals"):
                for method in (self.client.get, self.client.post):
                    response = method(f"/api/manage/{kind}/")
                    self.assertIn(response.status_code, (401, 403))

    def test_team_upload_replace_remove_delete(self):
        response = self.client.post(
            "/api/manage/team/",
            {"name": "Test person", "position": "cto", "portrait": picture()},
            format="multipart",
        )
        self.assertEqual(response.status_code, 201, response.data)
        path = f"/api/manage/team/{response.data['id']}/"
        first = response.data["image"]
        self.assertTrue(first.endswith(".webp"))
        response = self.client.patch(path, {"portrait": picture()}, format="multipart")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertNotEqual(first, response.data["image"])
        TeamMember.objects.filter(pk=response.data["id"]).update(
            image="https://example.com/legacy.png"
        )
        response = self.client.patch(path, {"remove_image": True}, format="json")
        self.assertEqual(response.data["image"], "")
        self.assertEqual(self.client.delete(path).status_code, 204)

    def test_invalid_upload_rejected(self):
        for contents in (
            b"<svg xmlns='http://www.w3.org/2000/svg'></svg>",
            b"x" * (4 * 1024 * 1024 + 1),
        ):
            response = self.client.post(
                "/api/manage/team/",
                {
                    "name": "Invalid",
                    "portrait": SimpleUploadedFile(
                        "image.png", contents, content_type="image/png"
                    ),
                },
                format="multipart",
            )
            self.assertEqual(response.status_code, 400)
        self.assertFalse(TeamMember.objects.filter(name="Invalid").exists())

    def test_products_multipart_features_and_image_removal(self):
        response = self.client.post(
            "/api/projects/products/",
            {
                "name": "Test product",
                "image": picture(),
                "focus": '["Feature one"]',
                "is_published": "true",
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["focus"], ["Feature one"])
        path = f"/api/projects/products/{response.data['id']}/"
        response = self.client.patch(path, {"image": None}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertFalse(Product.objects.get(pk=response.data["id"]).image)

    def test_services_duplicate_titles_and_testimonial_portrait(self):
        for _ in range(2):
            response = self.client.post(
                "/api/manage/services/",
                {"title": "Same title", "description": "Description", "icon": "code"},
                format="json",
            )
            self.assertEqual(response.status_code, 201, response.data)
        response = self.client.post(
            "/api/manage/testimonials/",
            {
                "name": "Client",
                "position": "Director",
                "content": "Helpful team",
                "portrait": picture(),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(response.data["image"].endswith(".webp"))
        public = self.client.get("/api/testimonials/list/")
        self.assertIn(response.data["image"], [row["image"] for row in public.data])
        path = f"/api/manage/testimonials/{response.data['id']}/"
        self.assertEqual(
            self.client.patch(path, {"remove_image": True}, format="json").data[
                "image"
            ],
            "",
        )

    def test_journal_cover_upload_and_remove(self):
        response = self.client.post(
            "/api/blog/journal/",
            {
                "title": "With cover",
                "excerpt": "Introduction",
                "content": "Journal body",
                "image": "",
                "cover_image": picture(),
                "is_published": "true",
                "published_at": "",
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(response.data["cover_image"].endswith(".webp"))
        public = self.client.get("/api/blog/blog-posts/")
        self.assertIn(
            response.data["cover_image"], [row["image"] for row in public.data]
        )
        response = self.client.patch(
            f"/api/blog/journal/{response.data['id']}/",
            {"remove_cover": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertFalse(response.data["cover_image"])
