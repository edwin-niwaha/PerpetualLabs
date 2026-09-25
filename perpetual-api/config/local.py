"""Isolated local development settings; never connects to the production database."""
from .settings import *  # noqa: F403,F401

DEBUG = True
SECRET_KEY = "local-development-only-do-not-use-in-production"
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
EMAIL_HOST_USER = "local@example.test"
HOST_EMAIL = "local@example.test"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
