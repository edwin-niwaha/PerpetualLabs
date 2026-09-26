from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase, APITransactionTestCase

from api.notifications import send_contact_email, send_delivery

from .models import Contact, EmailDelivery, PortalNotification, PortalService


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="mail@example.com",
    HOST_EMAIL="team@example.com",
)
class PortalTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = get_user_model().objects.create_user(
            username="client",
            email="client@example.com",
            password="Strong-Client-Test!429",
        )
        self.other = get_user_model().objects.create_user(
            username="other-client",
            email="other@example.com",
            password="Strong-Other-Test!429",
        )

    def test_portal_is_private_and_cannot_read_other_users_messages(self):
        mine = PortalNotification.objects.create(
            user=self.user, title="My update", body="Private account update"
        )
        theirs = PortalNotification.objects.create(
            user=self.other, title="Secret update", body="Another account"
        )
        self.assertEqual(self.client.get("/api/auth/portal/").status_code, 401)
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/auth/portal/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["id"] for item in response.data["notifications"]], [mine.pk]
        )
        self.assertEqual(response.data["unread_count"], 1)
        self.assertEqual(
            self.client.patch(
                f"/api/auth/notifications/{theirs.pk}/", {"read": True}
            ).status_code,
            404,
        )
        self.assertEqual(
            self.client.patch(
                f"/api/auth/notifications/{mine.pk}/",
                {"read": True, "user": self.other.pk, "title": "hijack"},
            ).status_code,
            200,
        )
        mine.refresh_from_db()
        self.assertIsNotNone(mine.read_at)
        self.assertEqual(mine.user, self.user)
        self.assertEqual(mine.title, "My update")
        self.assertEqual(self.client.get("/api/auth/portal/").data["unread_count"], 0)

    def test_contact_sends_both_emails_and_only_exposes_client_copy(self):
        self.client.force_authenticate(self.user)
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                "/api/auth/contacts/",
                {
                    "name": "Client",
                    "email": self.user.email,
                    "user_message": "Please discuss my new project.",
                    "user": self.other.pk,
                },
            )
        contact = Contact.objects.get(pk=response.data["data"]["id"])
        self.assertEqual(contact.user, self.user)
        self.assertEqual(
            set(message.to[0] for message in mail.outbox),
            {self.user.email, "team@example.com"},
        )
        self.assertEqual(contact.email_deliveries.filter(status="accepted").count(), 2)
        data = self.client.get("/api/auth/portal/").data
        self.assertEqual(len(data["emails"]), 1)
        self.assertEqual(
            data["emails"][0]["subject"], "We received your message — Perpetual Labs"
        )
        self.assertEqual(data["inquiries"][0]["id"], contact.pk)
        self.assertEqual(len(data["notifications"]), 1)
        self.client.force_authenticate(self.other)
        data = self.client.get("/api/auth/portal/").data
        self.assertEqual(data["emails"], [])
        self.assertEqual(data["inquiries"], [])

    def test_guest_email_matching_account_does_not_link_private_records(self):
        with self.captureOnCommitCallbacks(execute=True):
            Contact.objects.create(
                name="Guest", email=self.user.email, user_message="A guest inquiry"
            )
        self.client.force_authenticate(self.user)
        data = self.client.get("/api/auth/portal/").data
        self.assertEqual(data["inquiries"], [])
        self.assertEqual(data["emails"], [])

    def test_failed_emails_are_saved_and_retry_does_not_duplicate_successes(self):
        contact = Contact.objects.create(
            name="Client", email=self.user.email, user_message="Project inquiry"
        )
        with patch(
            "api.notifications.EmailMultiAlternatives.send",
            side_effect=[1, RuntimeError("private provider error")],
        ):
            send_contact_email(contact)
        team = contact.email_deliveries.get(audience="team")
        client = contact.email_deliveries.get(audience="client")
        self.assertEqual(team.status, "accepted")
        self.assertEqual(client.status, "failed")
        self.assertNotIn("private provider error", client.last_error)
        with patch(
            "api.notifications.EmailMultiAlternatives.send", return_value=1
        ) as retry:
            send_contact_email(contact)
        self.assertEqual(retry.call_count, 1)
        self.assertEqual(contact.email_deliveries.count(), 2)
        client.refresh_from_db()
        self.assertEqual(client.status, "accepted")
        self.assertEqual(client.attempts, 2)
        self.assertTrue(send_delivery(client.pk))
        client.refresh_from_db()
        self.assertEqual(client.attempts, 2)

    def test_saved_submission_does_not_claim_delivery_when_callbacks_pending(self):
        response = self.client.post(
            "/api/auth/contacts/",
            {
                "name": "Client",
                "email": self.user.email,
                "user_message": "Discuss a project please.",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["email_status"], "pending")
        self.assertIn("could not be sent yet", response.data["message"])

    def test_staff_notification_can_send_email_and_unpublished_services_are_hidden(
        self,
    ):
        with self.captureOnCommitCallbacks(execute=True):
            notification = PortalNotification.objects.create(
                user=self.user,
                title="Project update",
                body="Your next step is ready.",
                email_requested=True,
            )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.user.email])
        self.assertTrue(
            EmailDelivery.objects.filter(
                user=self.user, deduplication_key=f"portal:{notification.pk}"
            ).exists()
        )
        PortalService.objects.create(
            title="Unannounced", description="Private roadmap", is_published=False
        )
        self.client.force_authenticate(self.user)
        self.assertNotIn(
            "Unannounced",
            [
                item["title"]
                for item in self.client.get("/api/auth/portal/").data["services"]
            ],
        )


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="mail@example.com",
    HOST_EMAIL="team@example.com",
)
class ContactReceiptTests(APITransactionTestCase):
    def setUp(self):
        cache.clear()

    def submit(self):
        return self.client.post(
            "/api/auth/contacts/",
            {
                "name": "Client",
                "email": "client@example.com",
                "user_message": "A saved inquiry for receipt validation.",
            },
        )

    def test_response_confirms_only_when_both_emails_are_accepted(self):
        response = self.submit()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["email_status"], "accepted")
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(EmailDelivery.objects.filter(status="accepted").count(), 2)

    @patch(
        "api.notifications.EmailMultiAlternatives.send",
        side_effect=[1, RuntimeError("provider rejected")],
    )
    def test_partial_failure_is_reported_without_losing_the_saved_inquiry(self, send):
        response = self.submit()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["email_status"], "pending")
        self.assertIn("could not be sent yet", response.data["message"])
        self.assertEqual(Contact.objects.count(), 1)
        self.assertEqual(EmailDelivery.objects.filter(status="accepted").count(), 1)
        self.assertEqual(EmailDelivery.objects.filter(status="failed").count(), 1)
