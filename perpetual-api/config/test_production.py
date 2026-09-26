"""Regression checks for production startup and transport security."""

import os
import runpy
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, override_settings

ENV = {
    "SECRET_KEY": "test-only-abcdefghijklmnopqrstuvwxyz0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "ALLOWED_HOSTS": "api.example.com",
    "SITE_URL": "https://api.example.com",
    "FRONTEND_URL": "https://example.com",
    "DATABASE_URL": "postgresql://test:test@localhost/test",
    "RESEND_API_KEY": "re_test_only",
    "RESEND_FROM_EMAIL": "Perpetual Labs <mail@example.com>",
    "HOST_EMAIL": "host@example.com",
    "CLOUDINARY_CLOUD_NAME": "test",
    "CLOUDINARY_API_KEY": "test",
    "CLOUDINARY_API_SECRET": "test",
}


class ProductionSettingsTests(SimpleTestCase):
    def load(self, **changes):
        env = {**ENV, **changes}
        with patch.dict(os.environ, env, clear=True):
            return runpy.run_module("config.production")

    def test_postgres_fallback_requires_explicit_credentials(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "DB_NAME"):
            self.load(DATABASE_URL="")
        config = self.load(
            DATABASE_URL="",
            DB_NAME="app",
            DB_USER="writer",
            DB_PASSWORD="test",
            DB_HOST="db",
        )
        self.assertEqual(config["DATABASES"]["default"]["NAME"], "app")
        self.assertEqual(
            config["DATABASES"]["default"]["OPTIONS"]["sslmode"], "require"
        )

    def test_missing_secret_fails_closed(self):
        with self.assertRaisesMessage(ImproperlyConfigured, "SECRET_KEY"):
            self.load(SECRET_KEY="")

    def test_unsafe_configuration_is_rejected(self):
        for changes in [
            {"DEBUG": "true"},
            {"RESEND_API_KEY": ""},
            {"RESEND_FROM_EMAIL": "not-an-email"},
            {"RESEND_FROM_EMAIL": "Perpetual Labs <onboarding@resend.dev>"},
            {"HOST_EMAIL": "host@example.com\nBcc: other@example.com"},
            {"ALLOWED_HOSTS": "*"},
            {"FRONTEND_URL": "http://example.com"},
            {"SITE_URL": "https://user:password@example.com"},
            {"DATABASE_URL": "sqlite:///db.sqlite3"},
            {"SECRET_KEY": "replace-with-a-long-random-secret"},
        ]:
            with self.subTest(changes=list(changes)):
                with self.assertRaises(ImproperlyConfigured):
                    self.load(**changes)

    def test_production_uses_shared_cache_and_secure_storage(self):
        config = self.load()
        self.assertEqual(
            config["EMAIL_BACKEND"], "config.email_backends.ResendEmailBackend"
        )
        self.assertEqual(config["DEFAULT_FROM_EMAIL"], ENV["RESEND_FROM_EMAIL"])
        self.assertEqual(config["SERVER_EMAIL"], ENV["RESEND_FROM_EMAIL"])
        self.assertEqual(config["REST_FRAMEWORK"]["NUM_PROXIES"], 0)
        self.assertFalse(config["DEBUG"])
        self.assertEqual(config["SITE_URL"], ENV["SITE_URL"])
        self.assertEqual(config["BASE_DOMAIN"], "api.example.com")
        self.assertEqual(config["DJANGO_ENV"], "production")
        self.assertEqual(
            config["GOOGLE_REDIRECT_URI"], "https://example.com/auth/google/callback"
        )
        self.assertFalse(config["CORS_ALLOW_ALL_ORIGINS"])
        self.assertFalse(config["ENABLE_API_DOCS"])
        self.assertTrue(config["SESSION_COOKIE_SECURE"])
        self.assertTrue(config["CSRF_COOKIE_SECURE"])
        self.assertEqual(
            config["DATABASES"]["default"]["OPTIONS"]["sslmode"], "require"
        )
        self.assertEqual(
            config["CACHES"]["default"]["BACKEND"],
            "django.core.cache.backends.db.DatabaseCache",
        )
        self.assertEqual(
            config["STORAGES"]["staticfiles"]["BACKEND"],
            "whitenoise.storage.CompressedManifestStaticFilesStorage",
        )
        self.assertIsNone(config["SECURE_PROXY_SSL_HEADER"])
        self.assertEqual(
            self.load(TRUST_PROXY_HEADERS="true")["SECURE_PROXY_SSL_HEADER"],
            ("HTTP_X_FORWARDED_PROTO", "https"),
        )

    @override_settings(
        SECURE_SSL_REDIRECT=True,
        SECURE_REDIRECT_EXEMPT=[r"^health/$"],
        SESSION_COOKIE_SECURE=True,
        CSRF_COOKIE_SECURE=True,
    )
    def test_admin_requires_https_and_health_is_minimal(self):
        response = self.client.get("/admin/login/")
        self.assertEqual(response.status_code, 301)
        self.assertTrue(response["Location"].startswith("https://"))
        response = self.client.get("/admin/login/", secure=True)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.cookies["csrftoken"]["secure"])
        health = self.client.get("/health/")
        self.assertEqual(health.json(), {"status": "ok"})
        self.assertEqual(health["Cache-Control"], "no-store")
