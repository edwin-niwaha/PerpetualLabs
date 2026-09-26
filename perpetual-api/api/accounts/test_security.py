from unittest.mock import patch

from django.core import mail
from django.core.cache import cache
from django.db import transaction
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import Contact


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="mail@example.com",
    HOST_EMAIL="host@example.com",
)
class SubmissionSecurityTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_forwarded_headers_cannot_bypass_throttle(self):
        for index in range(11):
            response = self.client.post(
                "/api/auth/contacts/", {}, HTTP_X_FORWARDED_FOR=f"192.0.2.{index}"
            )
            self.assertEqual(response.status_code, 400 if index < 10 else 429)

    def test_login_and_registration_reject_oversized_passwords(self):
        for path in ("/api/auth/login/", "/api/auth/register/"):
            response = self.client.post(
                path,
                {
                    "username": "someone",
                    "email": "test@example.com",
                    "password": "x" * 129,
                },
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn("password", response.data)

    def test_refresh_is_bounded_and_throttled(self):
        for index in range(31):
            response = self.client.post("/api/token/refresh/", {"refresh": "x" * 4097})
            self.assertEqual(response.status_code, 400 if index < 30 else 429)

    def test_rollback_does_not_send_notifications(self):
        with self.captureOnCommitCallbacks(execute=True) as callbacks:
            try:
                with transaction.atomic():
                    Contact.objects.create(
                        name="Person",
                        email="person@example.com",
                        user_message="Valid message",
                    )
                    raise ValueError("rollback")
            except ValueError:
                pass
        self.assertEqual(callbacks, [])
        self.assertEqual(len(mail.outbox), 0)

    def test_notifications_commit_and_use_reply_to(self):
        with self.captureOnCommitCallbacks(execute=True):
            Contact.objects.create(
                name="Person",
                email="person@example.com",
                user_message="private message",
            )
            self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(mail.outbox[0].to, ["host@example.com"])
        self.assertEqual(mail.outbox[0].reply_to, ["person@example.com"])
        self.assertNotIn("private message", mail.outbox[1].body)
        self.assertTrue(
            all(message.from_email == "mail@example.com" for message in mail.outbox)
        )

    @patch(
        "api.notifications.EmailMultiAlternatives.send",
        side_effect=RuntimeError("provider failure"),
    )
    def test_delivery_outage_keeps_submission_and_attempts_both_messages(self, send):
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                "/api/auth/contacts/",
                {
                    "name": "Person",
                    "email": "person@example.com",
                    "user_message": "A valid inquiry message.",
                },
            )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Contact.objects.count(), 1)
        self.assertEqual(send.call_count, 2)
