import re
from datetime import timedelta
from io import BytesIO
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from PIL import Image
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .account_management import INVALID_RESET, replace_password
from .models import EmailDelivery
from .password_reset_mail import send_password_reset
from .serializers import ProfileSerializer

User = get_user_model()
OLD = "Before-Unique-Passphrase!37"
NEW = "After-Unique-Passphrase!82"


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="mail@example.com",
    FRONTEND_URL="https://clients.example.com",
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
        },
    },
)
class AccountManagementTests(APITestCase):
    def setUp(self):
        cache.clear()
        # Execute delivery inline for deterministic assertions in transactional tests.
        delivery = patch(
            "api.accounts.account_management.queue_password_reset",
            side_effect=lambda username: (send_password_reset(username), True)[1],
        )
        delivery.start()
        self.addCleanup(delivery.stop)
        self.user = User.objects.create_user(
            username="account-client", email="client@example.com", password=OLD
        )
        self.other = User.objects.create_user(
            username="other-client", email="other@example.com", password=OLD
        )

    def credentials(self, user=None):
        refresh = RefreshToken.for_user(user or self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        return refresh

    def reset_data(self, user=None):
        user = user or self.user
        return {
            "uid": urlsafe_base64_encode(force_bytes(user.pk)),
            "token": default_token_generator.make_token(user),
            "new_password": NEW,
            "confirm_password": NEW,
        }

    def image(self, name="picture.png", format="PNG"):
        stream = BytesIO()
        Image.new("RGB", (32, 32), "blue").save(stream, format=format)
        return SimpleUploadedFile(
            name, stream.getvalue(), content_type=f"image/{format.lower()}"
        )

    def change_data(self, **kwargs):
        return {
            "current_password": OLD,
            "new_password": NEW,
            "confirm_password": NEW,
            **kwargs,
        }

    def test_forgot_sends_configured_link_without_exposing_secrets_or_portal_history(
        self,
    ):
        response = self.client.post(
            "/api/auth/forgot-password/",
            {"username": self.user.username},
            HTTP_HOST="testserver",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.user.email])
        self.assertEqual(mail.outbox[0].from_email, "mail@example.com")
        link = re.search(r"https://[^\s]+", mail.outbox[0].body).group()
        self.assertTrue(link.startswith("https://clients.example.com/reset-password#"))
        params = parse_qs(urlsplit(link).fragment)
        self.assertTrue(
            default_token_generator.check_token(self.user, params["token"][0])
        )
        self.assertNotIn(params["token"][0], str(response.data))
        self.assertEqual(EmailDelivery.objects.count(), 0)

    def test_forgot_unknown_inactive_and_social_accounts_have_same_response(self):
        expected = self.client.post(
            "/api/auth/forgot-password/", {"username": self.user.username}
        ).data
        self.other.is_active = False
        self.other.save(update_fields=["is_active"])
        social = User.objects.create_user(username="social", email="social@example.com")
        for username in ["missing", self.other.username, social.username]:
            response = self.client.post(
                "/api/auth/forgot-password/", {"username": username}
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data, expected)
        self.assertEqual(len(mail.outbox), 1)

    @patch(
        "api.accounts.password_reset_mail.EmailMultiAlternatives.send",
        side_effect=RuntimeError("secret provider details"),
    )
    def test_forgot_delivery_error_is_generic(self, send):
        with self.assertLogs(
            "api.accounts.password_reset_mail", level="WARNING"
        ) as logs:
            known = self.client.post(
                "/api/auth/forgot-password/", {"username": self.user.username}
            )
        unknown = self.client.post(
            "/api/auth/forgot-password/", {"username": "missing"}
        )
        self.assertEqual(known.data, unknown.data)
        self.assertNotIn("secret provider details", str(logs.output))

    def test_forgot_validation_and_account_throttling_cannot_be_bypassed_by_ip(self):
        self.assertEqual(
            self.client.post(
                "/api/auth/forgot-password/", {"username": "x" * 151}
            ).status_code,
            400,
        )
        for index in range(6):
            response = self.client.post(
                "/api/auth/forgot-password/",
                {"username": "missing"},
                REMOTE_ADDR=f"192.0.2.{index}",
            )
            self.assertEqual(response.status_code, 200 if index < 5 else 429)

    def test_forgot_ip_throttle_ignores_forwarded_headers(self):
        for index in range(11):
            response = self.client.post(
                "/api/auth/forgot-password/",
                {"username": f"missing-{index}"},
                HTTP_X_FORWARDED_FOR=f"192.0.2.{index}",
            )
            self.assertEqual(response.status_code, 200 if index < 10 else 429)

    def test_reset_consumes_token_and_revokes_access_and_refresh(self):
        refresh = self.credentials()
        data = self.reset_data()
        response = self.client.post("/api/auth/reset-password/", data)
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(NEW, str(response.data))
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(NEW))
        self.assertEqual(
            self.client.post("/api/auth/reset-password/", data).status_code, 400
        )
        self.assertEqual(self.client.get("/api/auth/profile/").status_code, 401)
        self.client.credentials()
        self.assertEqual(
            self.client.post(
                "/api/token/refresh/", {"refresh": str(refresh)}
            ).status_code,
            401,
        )
        self.assertEqual(
            self.client.post(
                "/api/auth/login/", {"username": self.user.username, "password": OLD}
            ).status_code,
            401,
        )
        self.assertEqual(
            self.client.post(
                "/api/auth/login/", {"username": self.user.username, "password": NEW}
            ).status_code,
            200,
        )

    def test_reset_invalid_uid_token_and_wrong_account(self):
        for fields in [
            {"token": "invalid"},
            {"uid": "not-base64"},
            {
                "uid": urlsafe_base64_encode(
                    b"9999999999999999999999999999999999999999999999999"
                )
            },
            {"uid": urlsafe_base64_encode(force_bytes(self.other.pk))},
        ]:
            response = self.client.post(
                "/api/auth/reset-password/", {**self.reset_data(), **fields}
            )
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.data["detail"], INVALID_RESET)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(OLD))

    @override_settings(PASSWORD_RESET_TIMEOUT=1)
    def test_expired_reset(self):
        with patch.object(
            default_token_generator,
            "_now",
            return_value=timezone.now().replace(tzinfo=None) - timedelta(seconds=5),
        ):
            data = self.reset_data()
        self.assertEqual(
            self.client.post("/api/auth/reset-password/", data).status_code, 400
        )

    def test_reset_inactive_and_unusable_accounts(self):
        data = self.reset_data()
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])
        self.assertEqual(
            self.client.post("/api/auth/reset-password/", data).status_code, 400
        )
        self.user.is_active = True
        self.user.set_unusable_password()
        self.user.save()
        self.assertEqual(
            self.client.post(
                "/api/auth/reset-password/", self.reset_data()
            ).status_code,
            400,
        )

    def test_reset_policy_confirmation_and_password_lengths(self):
        for fields, field in [
            ({"confirm_password": "different"}, "confirm_password"),
            (
                {"new_password": "12345678", "confirm_password": "12345678"},
                "new_password",
            ),
            ({"new_password": "x" * 129}, "new_password"),
            ({"new_password": OLD, "confirm_password": OLD}, "new_password"),
        ]:
            response = self.client.post(
                "/api/auth/reset-password/", {**self.reset_data(), **fields}
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn(field, response.data)
        self.assertEqual(
            self.client.post(
                "/api/auth/reset-password/", self.reset_data()
            ).status_code,
            200,
        )

    def test_stale_simultaneous_password_mutation_cannot_succeed_twice(self):
        stale = User.objects.get(pk=self.user.pk)
        replace_password(self.user, NEW, {"detail": INVALID_RESET})
        from rest_framework.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            replace_password(
                stale, "Another-Unique-Passphrase!14", {"detail": INVALID_RESET}
            )
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(NEW))

    def test_private_endpoints_reject_anonymous(self):
        for method, path, data in [
            ("get", "profile/", None),
            ("patch", "profile/", {"bio": "hi"}),
            ("put", "profile/picture/", {}),
            ("delete", "profile/picture/", None),
            ("post", "change-password/", self.change_data()),
        ]:
            self.assertEqual(
                getattr(self.client, method)(f"/api/auth/{path}", data).status_code, 401
            )

    def test_profile_partial_updates_only_allowed_fields(self):
        self.credentials()
        response = self.client.patch(
            "/api/auth/profile/",
            {
                "first_name": "Updated",
                "date_of_birth": "1990-01-02",
                "id": self.other.pk,
                "email": self.other.email,
                "username": self.other.username,
                "is_staff": True,
                "is_superuser": True,
                "is_active": False,
                "password": NEW,
                "groups": [1],
                "user_permissions": [1],
                "profile_picture": "arbitrary.png",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.other.refresh_from_db()
        self.assertEqual(self.user.first_name, "Updated")
        self.assertEqual(self.user.email, "client@example.com")
        self.assertEqual(self.user.username, "account-client")
        self.assertFalse(self.user.is_staff or self.user.is_superuser)
        self.assertTrue(self.user.is_active)
        self.assertTrue(self.user.check_password(OLD))
        self.assertFalse(self.user.profile_picture)
        self.assertEqual(self.user.groups.count(), 0)
        self.assertEqual(self.user.user_permissions.count(), 0)
        self.assertNotEqual(self.other.first_name, "Updated")
        response = self.client.get("/api/auth/profile/", {"id": self.other.pk})
        self.assertEqual(response.data["id"], self.user.pk)
        self.assertNotIn("password", response.data)
        self.assertEqual(response.data["date_of_birth"], "1990-01-02")
        self.assertEqual(
            self.client.patch("/api/auth/profile/", {"bio": "New bio"}).status_code, 200
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Updated")

    def test_profile_invalid_fields_and_optional_date_clear(self):
        self.credentials()
        for fields in [
            {"date_of_birth": "2999-01-01"},
            {"date_of_birth": "bad"},
            {"bio": "x" * 2001},
            {"first_name": "x" * 51},
        ]:
            self.assertEqual(
                self.client.patch("/api/auth/profile/", fields).status_code, 400
            )
        self.assertEqual(
            self.client.patch(
                "/api/auth/profile/", {"date_of_birth": None}, format="json"
            ).status_code,
            200,
        )

    def test_stale_profile_update_does_not_restore_old_password(self):
        serializer = ProfileSerializer(self.user, data={"bio": "New bio"}, partial=True)
        serializer.is_valid(raise_exception=True)
        replace_password(User.objects.get(pk=self.user.pk), NEW, {})
        serializer.save()
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(NEW))

    def test_picture_upload_replace_delete_and_ownership(self):
        self.credentials()
        with self.captureOnCommitCallbacks(execute=True):
            first = self.client.put(
                "/api/auth/profile/picture/",
                {"profile_picture": self.image(), "id": self.other.pk},
                format="multipart",
            )
        self.assertEqual(first.status_code, 200)
        self.assertTrue(
            first.data["profile_picture"].startswith(
                "http://testserver/media/profiles/"
            )
        )
        self.user.refresh_from_db()
        original = self.user.profile_picture.name
        storage = self.user.profile_picture.storage
        self.assertTrue(storage.exists(original))
        with self.captureOnCommitCallbacks(execute=True):
            second = self.client.put(
                "/api/auth/profile/picture/",
                {"profile_picture": self.image()},
                format="multipart",
            )
        self.assertEqual(second.status_code, 200)
        self.assertNotEqual(
            first.data["profile_picture"], second.data["profile_picture"]
        )
        self.assertFalse(storage.exists(original))
        self.other.refresh_from_db()
        self.assertFalse(self.other.profile_picture)
        self.user.refresh_from_db()
        replacement = self.user.profile_picture.name
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.delete("/api/auth/profile/picture/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(storage.exists(replacement))
        self.assertIsNone(self.client.get("/api/auth/profile/").data["profile_picture"])
        self.assertEqual(
            self.client.delete("/api/auth/profile/picture/").status_code, 204
        )

    def test_picture_rejects_disallowed_corrupt_large_and_missing_files(self):
        self.credentials()
        for file in [
            SimpleUploadedFile(
                "fake.png", b"<script>bad</script>", content_type="image/png"
            ),
            self.image("picture.gif", "GIF"),
            SimpleUploadedFile(
                "big.png", b"x" * (4 * 1024 * 1024 + 1), content_type="image/png"
            ),
        ]:
            response = self.client.put(
                "/api/auth/profile/picture/",
                {"profile_picture": file},
                format="multipart",
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn("profile_picture", response.data)
        self.assertEqual(
            self.client.put(
                "/api/auth/profile/picture/", {}, format="multipart"
            ).status_code,
            400,
        )

    def test_change_checks_current_confirmation_policy_and_no_password_disclosure(self):
        self.credentials()
        for fields, field in [
            ({"current_password": "wrong"}, "current_password"),
            ({"confirm_password": "wrong"}, "confirm_password"),
            (
                {"new_password": "12345678", "confirm_password": "12345678"},
                "new_password",
            ),
            ({"current_password": "x" * 129}, "current_password"),
        ]:
            response = self.client.post(
                "/api/auth/change-password/", self.change_data(**fields)
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn(field, response.data)
            self.assertNotIn(OLD, str(response.data))
            self.assertNotIn(NEW, str(response.data))
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(OLD))

    def test_change_revokes_sessions_and_pending_reset_and_affects_only_owner(self):
        refresh = self.credentials()
        reset = self.reset_data()
        response = self.client.post(
            "/api/auth/change-password/", self.change_data(id=self.other.pk)
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get("/api/auth/profile/").status_code, 401)
        self.client.credentials()
        self.assertEqual(
            self.client.post(
                "/api/token/refresh/", {"refresh": str(refresh)}
            ).status_code,
            401,
        )
        self.assertEqual(
            self.client.post("/api/auth/reset-password/", reset).status_code, 400
        )
        self.other.refresh_from_db()
        self.assertTrue(self.other.check_password(OLD))

    def test_reset_and_change_throttled(self):
        for index in range(21):
            self.assertEqual(
                self.client.post("/api/auth/reset-password/", {}).status_code,
                400 if index < 20 else 429,
            )
        self.credentials()
        for index in range(11):
            self.assertEqual(
                self.client.post("/api/auth/change-password/", {}).status_code,
                400 if index < 10 else 429,
            )

    def test_refresh_for_deleted_account_is_rejected(self):
        refresh = RefreshToken.for_user(self.other)
        self.other.delete()
        self.assertEqual(
            self.client.post(
                "/api/token/refresh/", {"refresh": str(refresh)}
            ).status_code,
            401,
        )

    def test_non_object_reset_request_is_rejected(self):
        self.assertEqual(
            self.client.post(
                "/api/auth/forgot-password/", ["not-an-object"], format="json"
            ).status_code,
            400,
        )

    @patch("api.accounts.account_management.queue_password_reset", return_value=False)
    def test_queue_full_response_is_independent_of_username(self, queue):
        known = self.client.post(
            "/api/auth/forgot-password/", {"username": self.user.username}
        )
        unknown = self.client.post(
            "/api/auth/forgot-password/", {"username": "missing"}
        )
        self.assertEqual(known.status_code, 503)
        self.assertEqual(known.data, unknown.data)

    @patch("api.accounts.account_management.queue_password_reset", return_value=True)
    def test_request_queues_every_username_without_looking_up_accounts(self, queue):
        with self.assertNumQueries(0):
            for username in [self.user.username, "missing"]:
                response = self.client.post(
                    "/api/auth/forgot-password/", {"username": username}
                )
                self.assertEqual(response.status_code, 200)
                queue.assert_called_with(username)

    def test_openapi_includes_account_endpoints_and_picture_upload(self):
        response = self.client.get("/swagger.json/")
        self.assertEqual(response.status_code, 200)
        schema = response.data
        paths = {
            schema.get("basePath", "").rstrip("/") + path: operations
            for path, operations in schema["paths"].items()
        }
        for path in ["forgot-password", "reset-password", "change-password"]:
            self.assertIn("post", paths[f"/api/auth/{path}/"])
        self.assertIn("put", paths["/api/auth/profile/picture/"])
        self.assertIn("delete", paths["/api/auth/profile/picture/"])
