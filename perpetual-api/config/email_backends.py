"""Django mail transport using Resend HTTPS, with no SMTP fallback."""

import base64
import json
import logging
from http.client import HTTPSConnection
from uuid import uuid4

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.message import forbid_multi_line_headers

logger = logging.getLogger(__name__)


class EmailDeliveryError(Exception):
    """A sanitized transport error safe to log without message content or secrets."""


class ResendEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        sent = 0
        for message in email_messages or []:
            if not message.recipients():
                continue
            try:
                self._send(message)
                sent += 1
            except Exception:
                # Do not log provider responses, subjects, recipient addresses or keys.
                logger.warning("Resend delivery failed.")
                if not self.fail_silently:
                    raise
        return sent

    def _send(self, message):
        if not settings.RESEND_API_KEY or not settings.RESEND_FROM_EMAIL:
            raise ImproperlyConfigured(
                "Configure RESEND_API_KEY and RESEND_FROM_EMAIL."
            )
        # Retain Django's header-injection validation, including custom headers.
        message.message()
        for value in [
            settings.RESEND_FROM_EMAIL,
            *message.recipients(),
            *message.reply_to,
        ]:
            forbid_multi_line_headers("Address", value, "utf-8")
        payload = {
            "from": settings.RESEND_FROM_EMAIL,
            "subject": message.subject,
        }
        for field in ("to", "cc", "bcc", "reply_to"):
            if value := getattr(message, field):
                payload[field] = list(value)
        payload["html" if message.content_subtype == "html" else "text"] = message.body
        for content, mimetype in getattr(message, "alternatives", []):
            if mimetype in {"text/html", "text/plain"}:
                payload["html" if mimetype == "text/html" else "text"] = content
        attachments = []
        for attachment in message.attachments:
            if hasattr(attachment, "get_payload"):
                filename = attachment.get_filename()
                content = attachment.get_payload(decode=True)
                mimetype = attachment.get_content_type()
            else:
                filename, content, mimetype = attachment
            if isinstance(content, str):
                content = content.encode("utf-8")
            if not filename or content is None:
                raise ValueError("Email attachments must have a filename and content.")
            attachments.append(
                {
                    "filename": filename,
                    "content": base64.b64encode(content).decode("ascii"),
                    "content_type": mimetype,
                }
            )
        if attachments:
            payload["attachments"] = attachments
        reserved = {"from", "to", "cc", "bcc", "subject", "reply-to", "content-type"}
        headers = {
            k: v for k, v in message.extra_headers.items() if k.lower() not in reserved
        }
        if headers:
            payload["headers"] = headers
        # Reusing a message object after an uncertain failure retains its identity.
        if not hasattr(message, "_resend_idempotency_key"):
            message._resend_idempotency_key = str(uuid4())
        connection = HTTPSConnection("api.resend.com", timeout=settings.EMAIL_TIMEOUT)
        try:
            connection.request(
                "POST",
                "/emails",
                body=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                    "User-Agent": "PerpetualLabs/1.0",
                    "Idempotency-Key": message._resend_idempotency_key,
                },
            )
            response = connection.getresponse()
            # HTTPSConnection never follows redirects to an arbitrary host.
            if not 200 <= response.status < 300:
                reason = "provider_error"
                try:
                    error = json.loads(response.read(65536))
                    code = error.get("name", "")
                    allowed = {
                        "validation_error",
                        "restricted_api_key",
                        "suspended_api_key",
                        "missing_api_key",
                        "rate_limit_exceeded",
                        "daily_quota_exceeded",
                        "monthly_quota_exceeded",
                        "invalid_api_key",
                        "invalid_idempotent_request",
                    }
                    if code in allowed:
                        reason = code
                    detail = str(error.get("message", "")).lower()
                    if "domain" in detail and "not verified" in detail:
                        reason = "sender_domain_not_verified"
                    elif "only send testing emails" in detail:
                        reason = "resend_test_recipient_restriction"
                except (ValueError, AttributeError, TypeError):
                    pass
                raise EmailDeliveryError(f"Resend HTTP {response.status}: {reason}")
            result = json.loads(response.read(65536))
            if not isinstance(result, dict) or not result.get("id"):
                raise EmailDeliveryError("Resend returned an invalid delivery receipt.")
            message.resend_id = result["id"]
        except EmailDeliveryError:
            raise
        except Exception:
            raise EmailDeliveryError("Unable to complete Resend delivery.") from None
        finally:
            connection.close()
