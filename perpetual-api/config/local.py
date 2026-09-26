"""Local development uses PostgreSQL; isolated tests may explicitly select SQLite."""

import os
from urllib.parse import urlsplit

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403,F401
from .base import BASE_DIR
from .database import database_config
from .environment import boolean, frontend_origin, google_configuration

if os.getenv("DJANGO_ENV", "").strip().lower() == "production":
    raise ImproperlyConfigured(
        "DJANGO_ENV=production cannot use config.local. Set DJANGO_SETTINGS_MODULE=config.settings."
    )

DEBUG = True
SECRET_KEY = "local-development-only-do-not-use-in-production"
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]
LOCAL_DATABASE = os.getenv("LOCAL_DATABASE", "postgresql").strip().lower()
if LOCAL_DATABASE == "sqlite":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
elif LOCAL_DATABASE == "postgresql":
    DATABASES = database_config(ssl_require=boolean("DB_SSL_REQUIRE", False))
else:
    raise ImproperlyConfigured("LOCAL_DATABASE must be sqlite or postgresql.")
# Inherit Cloudinary storage in development; offline tests override STORAGES.


DJANGO_ENV = "development"
# A production SITE_URL in a shared env file must not leak into local links.
SITE_URL = (
    os.getenv("SITE_URL_DEVELOPMENT", "http://127.0.0.1:8000").strip().rstrip("/")
)
BASE_DOMAIN = urlsplit(SITE_URL).hostname or "localhost"
FRONTEND_URL = frontend_origin(development=True)
CORS_ALLOWED_ORIGINS = [FRONTEND_URL]
CSRF_TRUSTED_ORIGINS = [FRONTEND_URL]
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI = google_configuration(
    FRONTEND_URL, development=True
)
