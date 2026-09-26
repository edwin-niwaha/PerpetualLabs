"""Shared PostgreSQL settings for Railway and explicit local PostgreSQL use."""

import os

import dj_database_url
from django.core.exceptions import ImproperlyConfigured


def database_config(ssl_require=False):
    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        try:
            default = dj_database_url.parse(
                url,
                conn_max_age=600,
                conn_health_checks=True,
                ssl_require=ssl_require,
            )
        except (ValueError, TypeError):
            raise ImproperlyConfigured(
                "DATABASE_URL must be a valid PostgreSQL URL."
            ) from None
        if default["ENGINE"] != "django.db.backends.postgresql":
            raise ImproperlyConfigured("DATABASE_URL must use PostgreSQL.")
        return {"default": default}

    default = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DB_NAME", "default_db_name"),
        "USER": os.environ.get("DB_USER", "default_user"),
        "PASSWORD": os.environ.get("DB_PASSWORD", "default_password"),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
        "CONN_MAX_AGE": 600,
        "CONN_HEALTH_CHECKS": True,
    }
    if ssl_require:
        default["OPTIONS"] = {"sslmode": "require"}
    return {"default": default}
