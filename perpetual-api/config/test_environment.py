"""Environment selection and OAuth callback configuration regressions."""

import os
import runpy
from types import ModuleType
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from .environment import django_environment, frontend_origin, google_configuration


class EnvironmentTests(SimpleTestCase):
    def test_environment_defaults_to_production_and_rejects_typos(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(django_environment(), "production")
        with patch.dict(os.environ, {"DJANGO_ENV": "developmnt"}, clear=True):
            with self.assertRaises(ImproperlyConfigured):
                django_environment()

    def test_settings_entry_point_selects_both_environments(self):
        local, production = ModuleType("config.local"), ModuleType("config.production")
        local.TEST_SELECTED = "development"
        production.TEST_SELECTED = "production"
        for mode in ["development", "production"]:
            with (
                self.subTest(mode=mode),
                patch.dict(os.environ, {"DJANGO_ENV": mode}, clear=True),
                patch("dotenv.load_dotenv"),
                patch.dict(
                    "sys.modules",
                    {"config.local": local, "config.production": production},
                ),
            ):
                self.assertEqual(
                    runpy.run_module("config.settings")["TEST_SELECTED"], mode
                )

    def test_local_defaults_and_separate_production_origin(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(frontend_origin(True), "http://localhost:3000")
            with self.assertRaises(ImproperlyConfigured):
                frontend_origin(False)
        with patch.dict(
            os.environ,
            {
                "FRONTEND_URL_DEVELOPMENT": "http://localhost:3000",
                "FRONTEND_URL_PRODUCTION": "https://perpetuallabs.tech",
            },
            clear=True,
        ):
            self.assertEqual(frontend_origin(True), "http://localhost:3000")
            self.assertEqual(frontend_origin(False), "https://perpetuallabs.tech")

    def test_production_rejects_local_private_or_malformed_origins(self):
        for value in [
            "http://perpetuallabs.tech",
            "https://localhost",
            "https://192.168.1.4",
            "https://DESKTOP-2KD2DOJ",
            "https://site.local",
            "https://user:password@example.com",
            "https://example.com/path",
            "https://example.com?x=1",
        ]:
            with (
                self.subTest(value=value),
                patch.dict(os.environ, {"FRONTEND_URL": value}, clear=True),
            ):
                with self.assertRaises(ImproperlyConfigured):
                    frontend_origin(False)

    def test_callback_and_credentials_follow_environment(self):
        values = {
            "GOOGLE_CLIENT_ID_DEVELOPMENT": "dev-id",
            "GOOGLE_CLIENT_SECRET_DEVELOPMENT": "dev-secret",
            "GOOGLE_CLIENT_ID_PRODUCTION": "prod-id",
            "GOOGLE_CLIENT_SECRET_PRODUCTION": "prod-secret",
        }
        with patch.dict(os.environ, values, clear=True):
            self.assertEqual(
                google_configuration("http://localhost:3000", True),
                ("dev-id", "dev-secret", "http://localhost:3000/auth/google/callback"),
            )
            self.assertEqual(
                google_configuration("https://perpetuallabs.tech", False),
                (
                    "prod-id",
                    "prod-secret",
                    "https://perpetuallabs.tech/auth/google/callback",
                ),
            )

    def test_shared_client_credentials_supported_without_callback_override(self):
        with patch.dict(
            os.environ,
            {"GOOGLE_CLIENT_ID": "shared-id", "GOOGLE_CLIENT_SECRET": "shared-secret"},
            clear=True,
        ):
            self.assertEqual(
                google_configuration("https://perpetuallabs.tech", False)[0],
                "shared-id",
            )

    def test_stale_callback_and_incomplete_credentials_fail_with_clear_errors(self):
        with patch.dict(
            os.environ,
            {"GOOGLE_REDIRECT_URI": "http://localhost:3000/auth/google/callback"},
            clear=True,
        ):
            with self.assertRaisesMessage(ImproperlyConfigured, "must match"):
                google_configuration("https://perpetuallabs.tech", False)
        with patch.dict(os.environ, {"GOOGLE_CLIENT_ID": "missing-secret"}, clear=True):
            with self.assertRaisesMessage(ImproperlyConfigured, "both"):
                google_configuration("http://localhost:3000", True)

    def test_legacy_local_override_cannot_enable_debug_in_production(self):
        with patch.dict(os.environ, {"DJANGO_ENV": "production"}, clear=True):
            with self.assertRaisesMessage(
                ImproperlyConfigured, "cannot use config.local"
            ):
                runpy.run_module("config.local")

    def test_local_api_origin_does_not_inherit_production_origin(self):
        with patch.dict(
            os.environ,
            {"DJANGO_ENV": "development", "SITE_URL": "https://api.example.com"},
            clear=True,
        ):
            config = runpy.run_module("config.local")
            self.assertEqual(config["SITE_URL"], "http://127.0.0.1:8000")
            self.assertEqual(config["BASE_DOMAIN"], "127.0.0.1")
        with patch.dict(
            os.environ,
            {
                "DJANGO_ENV": "development",
                "SITE_URL_DEVELOPMENT": "http://localhost:8100",
            },
            clear=True,
        ):
            config = runpy.run_module("config.local")
            self.assertEqual(config["SITE_URL"], "http://localhost:8100")
