import json
from unittest.mock import patch

from django.core.mail import BadHeaderError, EmailMessage, EmailMultiAlternatives
from django.test import SimpleTestCase, override_settings

from .email_backends import EmailDeliveryError, ResendEmailBackend


@override_settings(
    RESEND_API_KEY="re_test_only",
    RESEND_FROM_EMAIL="Labs <mail@example.com>",
    EMAIL_TIMEOUT=10,
)
class ResendBackendTests(SimpleTestCase):
    def setUp(self):
        self.transport = patch("config.email_backends.HTTPSConnection")
        self.connection_type = self.transport.start()
        self.addCleanup(self.transport.stop)
        self.connection = self.connection_type.return_value
        self.response = self.connection.getresponse.return_value
        self.response.status = 200
        self.response.read.return_value = b'{"id": "test-delivery"}'

    def test_multipart_envelope_attachments_and_fixed_sender(self):
        message = EmailMultiAlternatives(
            "Hello",
            "Text",
            "spoof@example.com",
            ["to@example.com"],
            cc=["cc@example.com"],
            bcc=["bcc@example.com"],
            reply_to=["reply@example.com"],
        )
        message.attach_alternative("<p>HTML</p>", "text/html")
        message.attach("test.txt", "attachment", "text/plain")
        backend = ResendEmailBackend()
        self.assertEqual(backend.send_messages([message]), 1)
        self.connection_type.assert_called_once_with("api.resend.com", timeout=10)
        args, kwargs = self.connection.request.call_args
        self.assertEqual(args, ("POST", "/emails"))
        payload = json.loads(kwargs["body"])
        self.assertEqual(payload["from"], "Labs <mail@example.com>")
        self.assertEqual(payload["text"], "Text")
        self.assertEqual(payload["html"], "<p>HTML</p>")
        self.assertEqual(payload["bcc"], ["bcc@example.com"])
        self.assertEqual(payload["reply_to"], ["reply@example.com"])
        self.assertEqual(payload["attachments"][0]["content"], "YXR0YWNobWVudA==")
        self.assertEqual(message.resend_id, "test-delivery")
        key = kwargs["headers"]["Idempotency-Key"]
        backend.send_messages([message])
        self.assertEqual(
            self.connection.request.call_args.kwargs["headers"]["Idempotency-Key"], key
        )
        self.connection.close.assert_called()

    def test_errors_and_redirects_are_sanitized(self):
        for status in (302, 401, 429, 500):
            with self.subTest(status=status):
                self.response.status = status
                with self.assertRaisesMessage(EmailDeliveryError, f"HTTP {status}"):
                    ResendEmailBackend().send_messages(
                        [EmailMessage("private", "body", to=["to@example.com"])]
                    )
        self.assertEqual(self.response.read.call_count, 4)

    def test_timeout_invalid_response_and_fail_silently(self):
        self.connection.request.side_effect = TimeoutError("private transport details")
        with self.assertRaisesMessage(EmailDeliveryError, "Unable to complete"):
            ResendEmailBackend().send_messages(
                [EmailMessage("hello", "body", to=["to@example.com"])]
            )
        self.assertEqual(
            ResendEmailBackend(fail_silently=True).send_messages(
                [EmailMessage("hello", "body", to=["to@example.com"])]
            ),
            0,
        )
        self.connection.request.side_effect = None
        self.response.read.return_value = b"{}"
        with self.assertRaisesMessage(EmailDeliveryError, "invalid delivery receipt"):
            ResendEmailBackend().send_messages(
                [EmailMessage("hello", "body", to=["to@example.com"])]
            )

    def test_header_injection_is_rejected_before_network(self):
        with self.assertRaises(BadHeaderError):
            ResendEmailBackend().send_messages(
                [
                    EmailMessage(
                        "Hello\r\nBcc: x@example.com", "body", to=["to@example.com"]
                    )
                ]
            )
        self.connection.request.assert_not_called()
        with self.assertRaises(BadHeaderError):
            ResendEmailBackend().send_messages(
                [
                    EmailMessage(
                        "Hello", "body", bcc=["to@example.com\nBcc: x@example.com"]
                    )
                ]
            )
        self.connection.request.assert_not_called()

    def test_empty_and_missing_configuration(self):
        self.assertEqual(ResendEmailBackend().send_messages([]), 0)
        self.assertEqual(
            ResendEmailBackend().send_messages([EmailMessage("hello", "body")]), 0
        )
        with override_settings(RESEND_API_KEY=""):
            self.assertEqual(
                ResendEmailBackend(fail_silently=True).send_messages(
                    [EmailMessage("hello", "body", to=["to@example.com"])]
                ),
                0,
            )
        self.connection.request.assert_not_called()
