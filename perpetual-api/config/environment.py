"""Small, strict environment readers shared by deployment settings."""

import os
from urllib.parse import urlsplit

from django.core.exceptions import ImproperlyConfigured


def required(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise ImproperlyConfigured(f"{name} must be configured for production.")
    return value


def boolean(name, default=False):
    value = os.environ.get(name, str(default)).strip().lower()
    if value not in {"true", "false", "1", "0"}:
        raise ImproperlyConfigured(f"{name} must be true or false.")
    return value in {"true", "1"}


def https_origin(name):
    value = required(name)
    url = urlsplit(value)
    if (
        url.scheme != "https"
        or not url.hostname
        or url.username
        or url.password
        or url.path not in {"", "/"}
        or url.query
        or url.fragment
        or "*" in value
    ):
        raise ImproperlyConfigured(
            f"{name} must be an HTTPS origin without credentials or a path."
        )
    return value.rstrip("/")


def email_address(name):
    from email.utils import parseaddr

    from django.core.exceptions import ValidationError
    from django.core.validators import validate_email

    value = required(name)
    if "\r" in value or "\n" in value:
        raise ImproperlyConfigured(f"{name} must be a single email address.")
    _, address = parseaddr(value)
    try:
        validate_email(address)
    except ValidationError:
        raise ImproperlyConfigured(f"{name} must be a valid email address.") from None
    return value


def django_environment():
    value = os.getenv("DJANGO_ENV", "production").strip().lower()
    if value not in {"development", "production"}:
        raise ImproperlyConfigured("DJANGO_ENV must be development or production.")
    return value


def frontend_origin(development):
    name = "FRONTEND_URL_DEVELOPMENT" if development else "FRONTEND_URL_PRODUCTION"
    value = (
        os.getenv(
            name,
            os.getenv("FRONTEND_URL", "http://localhost:3000" if development else ""),
        )
        .strip()
        .rstrip("/")
    )
    from ipaddress import ip_address

    try:
        url = urlsplit(value)
        host = url.hostname or ""
        local = host in {"localhost", "127.0.0.1", "::1"}
        try:
            ip_address(host)
            public_host = False
        except ValueError:
            public_host = "." in host and not host.endswith(
                (".localhost", ".local", ".internal", ".test")
            )
        valid = (url.scheme == "https" and public_host) or (
            development and local and url.scheme in {"http", "https"}
        )
        valid = (
            valid
            and not url.username
            and not url.password
            and not url.path
            and not url.query
            and not url.fragment
        )
        url.port  # Validate the port syntax.
    except ValueError:
        valid = False
    if not valid:
        raise ImproperlyConfigured(
            f"{name} (or FRONTEND_URL) must be a public HTTPS origin; localhost HTTP is allowed only in development."
        )
    return value


def google_configuration(frontend_url, development):
    suffix = "DEVELOPMENT" if development else "PRODUCTION"

    def value(name):
        return os.getenv(f"{name}_{suffix}", os.getenv(name, "")).strip()

    callback = frontend_url + "/auth/google/callback"
    override = value("GOOGLE_REDIRECT_URI")
    if override and override != callback:
        raise ImproperlyConfigured(
            f"GOOGLE_REDIRECT_URI must match the selected frontend: {callback}. Remove the override to derive it automatically."
        )
    client_id, secret = value("GOOGLE_CLIENT_ID"), value("GOOGLE_CLIENT_SECRET")
    if bool(client_id) != bool(secret):
        raise ImproperlyConfigured(
            "Configure both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET for the selected environment."
        )
    return client_id, secret, callback
