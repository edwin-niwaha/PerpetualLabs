from io import StringIO
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import Product, SiteVisual


@override_settings(
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
        },
    },
)
class ProductCatalogTests(APITestCase):
    def setUp(self):
        self.product = Product.objects.create(
            name="Public product",
            description="Database content",
            image="products/example.webp",
            is_featured=True,
        )
        self.private = Product.objects.create(
            name="Draft product", image="products/draft.webp", is_published=False
        )

    def test_public_list_hides_drafts_and_has_content_and_media(self):
        response = self.client.get("/api/projects/products/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Public product")
        self.assertEqual(response.data[0]["slug"], "public-product")
        self.assertIn("example.webp", response.data[0]["image"])
        self.assertEqual(
            self.client.get(f"/api/projects/products/{self.private.pk}/").status_code,
            404,
        )

    def test_visitors_and_regular_accounts_cannot_change_products(self):
        url = f"/api/projects/products/{self.product.pk}/"
        for user in [
            None,
            get_user_model().objects.create_user(
                username="ordinary", password="test-only-password"
            ),
        ]:
            self.client.force_authenticate(user)
            self.assertIn(
                self.client.post(
                    "/api/projects/products/", {"name": "Forged"}
                ).status_code,
                [401, 403],
            )
            self.assertIn(
                self.client.patch(url, {"name": "Changed"}).status_code, [401, 403]
            )
            self.assertIn(self.client.delete(url).status_code, [401, 403])
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, "Public product")

    def test_staff_can_edit_with_validation(self):
        staff = get_user_model().objects.create_user(username="editor", is_staff=True)
        self.client.force_authenticate(staff)
        url = f"/api/projects/products/{self.product.pk}/"
        self.assertEqual(
            self.client.patch(url, {"description": "Edited in API"}).status_code, 200
        )
        self.assertEqual(
            self.client.patch(url, {"focus": [42]}, format="json").status_code, 400
        )
        self.assertEqual(
            self.client.patch(url, {"website_url": "http://example.com"}).status_code,
            400,
        )

    def test_visuals_are_public_read_only(self):
        SiteVisual.objects.create(
            key="galaxy", image="site/galaxy.webp", alt="A galaxy"
        )
        self.assertEqual(
            self.client.get("/api/projects/visuals/galaxy/").data["alt"], "A galaxy"
        )
        self.assertEqual(
            self.client.post("/api/projects/visuals/", {}).status_code, 405
        )

    def test_seed_is_repeatable_and_preserves_admin_changes(self):
        with TemporaryDirectory() as media, override_settings(MEDIA_ROOT=media):
            call_command("seed_website", stdout=StringIO())
            item = Product.objects.get(slug="pendezaconnect")
            item.description = "Edited by the owner"
            item.save()
            original_image = item.image.name
            call_command("seed_website", stdout=StringIO())
            item.refresh_from_db()
            self.assertEqual(item.description, "Edited by the owner")
            self.assertEqual(item.image.name, original_image)
            self.assertEqual(Product.objects.filter(is_featured=True).count(), 5)
            self.assertEqual(SiteVisual.objects.count(), 2)
