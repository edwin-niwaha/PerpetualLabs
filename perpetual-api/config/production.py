"""Fail-closed production settings, inherited by config.settings."""

from urllib.parse import urlsplit

import dj_database_url
from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403
from .base import REST_FRAMEWORK as BASE_REST_FRAMEWORK
from .environment import (
    boolean,
    email_address,
    frontend_origin,
    google_configuration,
    https_origin,
    required,
)

DEBUG = False
if boolean("DEBUG"):
    raise ImproperlyConfigured("DEBUG must be false in production.")
SECRET_KEY = required("SECRET_KEY")
if (
    len(SECRET_KEY) < 50
    or len(set(SECRET_KEY)) < 5
    or SECRET_KEY.startswith("django-insecure-")
    or "replace-" in SECRET_KEY
):
    raise ImproperlyConfigured(
        "SECRET_KEY must be a unique random secret of at least 50 characters."
    )

SITE_URL = https_origin("SITE_URL")
BASE_DOMAIN = urlsplit(SITE_URL).hostname

DJANGO_ENV = "production"
FRONTEND_URL = frontend_origin(development=False)
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI = google_configuration(
    FRONTEND_URL, development=False
)
ALLOWED_HOSTS = [
    host.strip() for host in required("ALLOWED_HOSTS").split(",") if host.strip()
]
if not ALLOWED_HOSTS or any(
    "*" in host or "/" in host or host.startswith(".") for host in ALLOWED_HOSTS
):
    raise ImproperlyConfigured(
        "ALLOWED_HOSTS must contain explicit hostnames without wildcards or schemes."
    )
CSRF_TRUSTED_ORIGINS = [SITE_URL, FRONTEND_URL]
CORS_ALLOWED_ORIGINS = [FRONTEND_URL]
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = False

DATABASES = {
    "default": dj_database_url.parse(
        required("DATABASE_URL"),
        conn_max_age=60,
        conn_health_checks=True,
        ssl_require=boolean("DB_SSL_REQUIRE", True),
    )
}
if DATABASES["default"]["ENGINE"] != "django.db.backends.postgresql":
    raise ImproperlyConfigured("Production requires a PostgreSQL DATABASE_URL.")
# Shared across workers without an extra service. Create with manage.py createcachetable.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.db.DatabaseCache",
        "LOCATION": "perpetual_cache",
        "TIMEOUT": 300,
        "OPTIONS": {"MAX_ENTRIES": 10000},
    }
}

SECURE_SSL_REDIRECT = True
SECURE_REDIRECT_EXEMPT = [r"^health/$"]
SECURE_PROXY_SSL_HEADER = (
    ("HTTP_X_FORWARDED_PROTO", "https") if boolean("TRUST_PROXY_HEADERS") else None
)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"
SECURE_HSTS_SECONDS = 31536000
# Opt in only after verifying HTTPS on every subdomain and preload eligibility.
SECURE_HSTS_INCLUDE_SUBDOMAINS = boolean("HSTS_INCLUDE_SUBDOMAINS")
SECURE_HSTS_PRELOAD = boolean("HSTS_PRELOAD")
ENABLE_API_DOCS = False
REST_FRAMEWORK = {
    **BASE_REST_FRAMEWORK,
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
}

EMAIL_BACKEND = "config.email_backends.ResendEmailBackend"
RESEND_API_KEY = required("RESEND_API_KEY")
if any(character.isspace() for character in RESEND_API_KEY):
    raise ImproperlyConfigured("RESEND_API_KEY must not contain whitespace.")
RESEND_FROM_EMAIL = email_address("RESEND_FROM_EMAIL")
if "@resend.dev" in RESEND_FROM_EMAIL.lower():
    raise ImproperlyConfigured(
        "Production email requires a verified sender domain, not the Resend test sender."
    )
HOST_EMAIL = email_address("HOST_EMAIL")
DEFAULT_FROM_EMAIL = RESEND_FROM_EMAIL
SERVER_EMAIL = RESEND_FROM_EMAIL
CLOUDINARY_STORAGE = {
    "CLOUD_NAME": required("CLOUDINARY_CLOUD_NAME"),
    "API_KEY": required("CLOUDINARY_API_KEY"),
    "API_SECRET": required("CLOUDINARY_API_SECRET"),
    "SECURE": True,
}
STORAGES = {
    "default": {"BACKEND": "api.storage.BoundedMediaCloudinaryStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"
    },
}
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False}
    },
}
