from io import BytesIO
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from PIL import Image

from .admin import TeamMemberAdminForm
from .models import TeamMember


class TeamPortraitAdminTests(TestCase):
    def setUp(self):
        self.media = TemporaryDirectory()
        self.addCleanup(self.media.cleanup)
        self.settings_override = override_settings(
            MEDIA_ROOT=self.media.name,
            STORAGES={
                "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
                "staticfiles": {
                    "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
                },
            },
        )
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.user = get_user_model().objects.create_superuser(
            username="portrait-admin",
            email="portrait@example.test",
            password="Test-only-password!57",
        )
        self.client.force_login(self.user)
        self.member = TeamMember.objects.create(name="Portrait Example", position="cto")
        self.url = reverse("admin:accounts_teammember_change", args=[self.member.pk])

    def picture(self, filename="portrait.png"):
        data = BytesIO()
        Image.new("RGB", (16, 16), "green").save(data, format="PNG")
        return SimpleUploadedFile(filename, data.getvalue(), content_type="image/png")

    def save_picture(self, filename="portrait.png"):
        response = self.client.post(
            self.url,
            {
                "name": self.member.name,
                "position": "cto",
                "image": "",
                "portrait": self.picture(filename),
                "_save": "Save",
            },
        )
        self.assertEqual(response.status_code, 302)
        self.member.refresh_from_db()
        return self.member.portrait.name

    def test_add_replace_and_remove_picture_through_admin(self):
        first = self.save_picture()
        self.assertTrue(first.startswith("team/"))
        response = self.client.get("/api/auth/team-members/list/")
        record = next(item for item in response.json() if item["id"] == self.member.pk)
        self.assertEqual(
            record["image"], "http://testserver" + self.member.portrait.url
        )
        second = self.save_picture("replacement.png")
        self.assertNotEqual(first, second)
        self.member.image = "https://res.cloudinary.com/example/image/upload/legacy.png"
        self.member.save()
        response = self.client.post(
            self.url,
            {
                "name": self.member.name,
                "position": "cto",
                "image": self.member.image,
                "remove_picture": "on",
                "_save": "Save",
            },
        )
        self.assertEqual(response.status_code, 302)
        self.member.refresh_from_db()
        self.assertFalse(self.member.portrait)
        self.assertEqual(self.member.image, "")
        record = next(
            item
            for item in self.client.get("/api/auth/team-members/list/").json()
            if item["id"] == self.member.pk
        )
        self.assertEqual(record["image"], "")

    def test_create_member_with_picture(self):
        response = self.client.post(
            reverse("admin:accounts_teammember_add"),
            {
                "name": "New Person",
                "position": "marketing_officer",
                "portrait": self.picture(),
                "image": "",
                "_save": "Save",
            },
        )
        self.assertEqual(response.status_code, 302)
        self.assertTrue(TeamMember.objects.get(name="New Person").portrait)

    def test_legacy_url_and_no_picture_are_supported(self):
        self.member.full_clean()
        self.member.image = "https://res.cloudinary.com/example/image/upload/legacy.png"
        self.member.save()
        data = self.client.get("/api/auth/team-members/list/").json()
        self.assertEqual(
            next(p for p in data if p["id"] == self.member.pk)["image"],
            self.member.image,
        )

    def test_reject_invalid_image_and_conflicting_actions(self):
        data = {"name": "Example", "position": "cto", "image": ""}
        invalid = SimpleUploadedFile(
            "fake.png", b"not an image", content_type="image/png"
        )
        form = TeamMemberAdminForm(data, {"portrait": invalid}, instance=self.member)
        self.assertFalse(form.is_valid())
        self.assertIn("portrait", form.errors)
        form = TeamMemberAdminForm(
            {**data, "remove_picture": True},
            {"portrait": self.picture()},
            instance=self.member,
        )
        self.assertFalse(form.is_valid())
        self.assertIn("portrait", form.errors)

    def test_large_upload_rejected(self):
        picture = self.picture()
        picture.size = 8 * 1024 * 1024 + 1
        form = TeamMemberAdminForm(
            {"name": "Example", "position": "cto", "image": ""},
            {"portrait": picture},
            instance=self.member,
        )
        self.assertFalse(form.is_valid())
        self.assertIn("8 MB", str(form.errors))

    def test_non_admin_cannot_manage_pictures(self):
        self.client.logout()
        self.assertEqual(self.client.get(self.url).status_code, 302)
        user = get_user_model().objects.create_user(
            username="ordinary",
            email="ordinary@example.test",
            password="Test-password!57",
        )
        self.client.force_login(user)
        self.assertEqual(
            self.client.post(self.url, {"remove_picture": "on"}).status_code, 302
        )
        self.assertEqual(
            self.client.post("/api/auth/team-members/list/", {}).status_code, 405
        )

    def test_staff_without_model_permission_cannot_change_picture(self):
        self.user.is_superuser = False
        self.user.save()
        self.assertEqual(
            self.client.post(self.url, {"remove_picture": "on"}).status_code, 403
        )

    def test_unsupported_extension_rejected(self):
        form = TeamMemberAdminForm(
            {"name": "Example", "position": "cto", "image": ""},
            {"portrait": self.picture("portrait.gif")},
            instance=self.member,
        )
        self.assertFalse(form.is_valid())
        self.assertIn("portrait", form.errors)
