"""Exercise image models through the real backend with mocked network calls."""

import os
import runpy
from pathlib import Path
from unittest.mock import patch

from cloudinary.exceptions import Error
from cloudinary_storage.storage import MediaCloudinaryStorage
from django.apps import apps
from django.core.files.base import ContentFile
from django.db.models import ImageField
from django.test import SimpleTestCase, override_settings


@override_settings(
    CLOUDINARY_STORAGE={
        "CLOUD_NAME": "test-cloud",
        "API_KEY": "test-key",
        "API_SECRET": "test-secret",
        "SECURE": True,
    },
)
class CloudinaryImageTests(SimpleTestCase):
    def image_fields(self):
        return [
            (model, field)
            for model in apps.get_models()
            for field in model._meta.fields
            if isinstance(field, ImageField)
        ]

    def test_development_keeps_cloudinary_storage(self):
        with patch.dict(os.environ, {"DJANGO_ENV": "development"}):
            config = runpy.run_path(
                str(Path(__file__).resolve().parents[1] / "config" / "local.py"),
                run_name="config.local",
            )
        self.assertEqual(
            config["STORAGES"]["default"]["BACKEND"],
            "api.storage.BoundedMediaCloudinaryStorage",
        )

    @patch("cloudinary.uploader.destroy", return_value={"result": "ok"})
    @patch("cloudinary.uploader.upload")
    def test_all_image_models_upload_return_https_urls_and_delete(
        self, upload, destroy
    ):
        fields = self.image_fields()
        self.assertTrue(fields)
        for model, field in fields:
            with self.subTest(model=model._meta.label, field=field.name):
                self.assertIsInstance(field.storage, MediaCloudinaryStorage)
                public_id = f"media/{field.upload_to}example_unique"
                upload.return_value = {"public_id": public_id}
                image = getattr(model(), field.name)
                image.save("example.webp", ContentFile(b"mock-image"), save=False)
                self.assertEqual(image.name, public_id)
                self.assertEqual(upload.call_args.kwargs["resource_type"], "image")
                self.assertEqual(upload.call_args.kwargs["timeout"], 15)
                self.assertEqual(
                    upload.call_args.kwargs["folder"],
                    f"media/{field.upload_to.rstrip('/')}",
                )
                self.assertTrue(
                    image.url.startswith(
                        "https://res.cloudinary.com/test-cloud/image/upload/"
                    )
                )
                image.delete(save=False)
                destroy.assert_called_with(
                    public_id, invalidate=True, resource_type="image"
                )

    @patch("cloudinary.uploader.upload", side_effect=Error("Upload failed"))
    def test_upload_failure_does_not_commit_image_or_fall_back_to_disk(self, upload):
        for model, field in self.image_fields():
            with self.subTest(model=model._meta.label, field=field.name):
                image = getattr(model(), field.name)
                with self.assertRaises(Error):
                    image.save("example.webp", ContentFile(b"mock-image"), save=False)
                self.assertFalse(image.name)
