"""Persistent notification outbox and isolated delivery attempts."""

import logging
from datetime import timedelta
from email.utils import parseaddr

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.utils import timezone
from django.utils.html import format_html, strip_tags

from config.email_backends import EmailDeliveryError

logger = logging.getLogger(__name__)


def send_delivery(delivery_id):
    from api.accounts.models import EmailDelivery

    # Claim one attempt without holding a database lock over the network call.
    with transaction.atomic():
        delivery = EmailDelivery.objects.select_for_update().get(pk=delivery_id)
        if delivery.status == "accepted":
            return True
        if (
            delivery.status == "sending"
            and delivery.updated_at > timezone.now() - timedelta(minutes=5)
        ):
            return False
        delivery.status = "sending"
        delivery.attempts += 1
        delivery.save(update_fields=["status", "attempts", "updated_at"])
    message = EmailMultiAlternatives(
        subject=delivery.subject,
        body=delivery.body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[delivery.recipient],
        reply_to=[delivery.reply_to] if delivery.reply_to else None,
    )
    message.attach_alternative(delivery.html, "text/html")
    message._resend_idempotency_key = str(delivery.idempotency_key)
    try:
        if message.send() != 1:
            raise EmailDeliveryError("Email backend did not accept the message.")
        delivery.status = "accepted"
        delivery.provider_id = getattr(message, "resend_id", "")
        delivery.last_error = ""
    except Exception as error:
        delivery.status = "failed"
        delivery.last_error = (
            str(error)[:200]
            if isinstance(error, EmailDeliveryError)
            else "Email delivery failed. Check mail configuration."
        )
        logger.warning("Email delivery %s failed: %s", delivery.pk, delivery.last_error)
    delivery.save(update_fields=["status", "provider_id", "last_error", "updated_at"])
    return delivery.status == "accepted"


def deliver(
    subject,
    html,
    recipient,
    reply_to=None,
    *,
    key,
    user=None,
    contact=None,
    audience="client",
):
    from api.accounts.models import EmailDelivery

    delivery, _ = EmailDelivery.objects.get_or_create(
        deduplication_key=key,
        defaults={
            "subject": subject,
            "html": str(html),
            "body": strip_tags(html),
            "recipient": parseaddr(recipient or "")[1],
            "reply_to": parseaddr(reply_to or "")[1],
            "user": user,
            "contact": contact,
            "audience": audience,
        },
    )
    send_delivery(delivery.pk)
    return delivery


def send_contact_email(contact):
    from api.accounts.models import PortalNotification

    deliver(
        "New contact request — Perpetual Labs",
        format_html(
            "<h2>New contact request</h2><p>Name: {}</p><p>Email: {}</p><p>{}</p>",
            contact.name,
            contact.email,
            contact.user_message,
        ),
        settings.HOST_EMAIL,
        reply_to=contact.email,
        key=f"contact:{contact.pk}:team",
        contact=contact,
        audience="team",
    )
    deliver(
        "We received your message — Perpetual Labs",
        "<p>Thank you for contacting Perpetual Labs. Your inquiry is saved and our team will get back to you.</p>",
        contact.email,
        reply_to=settings.HOST_EMAIL,
        key=f"contact:{contact.pk}:client",
        contact=contact,
        user=contact.user,
    )
    # Ownership comes from authentication, never from matching an unverified email.
    if contact.user_id:
        PortalNotification.objects.get_or_create(
            user=contact.user,
            title=f"Inquiry #{contact.pk} received",
            defaults={
                "body": "Your inquiry is saved. You can track its email confirmation in your portal."
            },
        )


def send_subscription_email(subscriber):
    deliver(
        "New newsletter subscriber — Perpetual Labs",
        format_html(
            "<h2>Newsletter subscription</h2><p>Email: {}</p>", subscriber.email
        ),
        settings.HOST_EMAIL,
        key=f"newsletter:{subscriber.pk}:team",
        audience="team",
    )
    deliver(
        "Newsletter subscription — Perpetual Labs",
        "<p>Thank you for subscribing to Perpetual Labs. If you did not request this, reply to let us know.</p>",
        subscriber.email,
        reply_to=settings.HOST_EMAIL,
        key=f"newsletter:{subscriber.pk}:client",
    )


def send_portal_notification(notification):
    deliver(
        notification.title,
        format_html("<h2>{}</h2><p>{}</p>", notification.title, notification.body),
        notification.user.email,
        reply_to=settings.HOST_EMAIL,
        key=f"portal:{notification.pk}",
        user=notification.user,
    )
