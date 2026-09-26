"""Bounded, non-durable mail work using the configured Django email transport.

Lookup runs outside the HTTP request so provider latency cannot enumerate usernames.
No reset token is persisted in the portal's client-visible notification outbox.
"""

import logging
from concurrent.futures import ThreadPoolExecutor
from threading import BoundedSemaphore
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.db import close_old_connections
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.views.decorators.debug import sensitive_variables

logger = logging.getLogger(__name__)
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="password-reset")
_capacity = BoundedSemaphore(32)


@sensitive_variables()
def send_password_reset(username):
    user = get_user_model().objects.filter(username=username, is_active=True).first()
    if not user or not user.email or not user.has_usable_password():
        return
    fragment = urlencode(
        {
            "uid": urlsafe_base64_encode(force_bytes(user.pk)),
            "token": default_token_generator.make_token(user),
        }
    )
    link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password#{fragment}"
    message = EmailMultiAlternatives(
        subject="Reset your Perpetual Labs password",
        body=f"Use this link to reset your password:\n\n{link}\n\nThis link expires in {settings.PASSWORD_RESET_TIMEOUT // 60} minutes and can be used once. If you did not request this, you can ignore this email.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    try:
        if message.send() != 1:
            logger.warning(
                "Password reset email was not accepted by the email backend."
            )
    except Exception:
        logger.warning("Password reset email could not be sent.")


@sensitive_variables()
def _deliver(username):
    try:
        close_old_connections()
        send_password_reset(username)
    except Exception:
        # Do not log provider payloads, account details, or reset credentials.
        logger.warning("Password reset delivery could not be completed.")
    finally:
        close_old_connections()
        _capacity.release()


def queue_password_reset(username):
    if not _capacity.acquire(blocking=False):
        return False
    try:
        _executor.submit(_deliver, username)
    except RuntimeError:
        _capacity.release()
        return False
    return True
