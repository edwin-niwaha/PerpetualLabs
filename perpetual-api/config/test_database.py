import os
import runpy
from pathlib import Path
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from .database import database_config


class DatabaseConfigTests(SimpleTestCase):
    def test_url_takes_precedence_and_keeps_connection_options(self):
        with patch.dict(
            os.environ,
            {
                "DATABASE_URL": "postgresql://writer:pass@db:5433/app",
                "DB_NAME": "ignored",
            },
            clear=True,
        ):
            config = database_config(True)["default"]
        self.assertEqual(config["NAME"], "app")
        self.assertEqual(config["HOST"], "db")
        self.assertEqual(config["CONN_MAX_AGE"], 600)
        self.assertTrue(config["CONN_HEALTH_CHECKS"])
        self.assertEqual(config["OPTIONS"]["sslmode"], "require")

    def test_fallback_and_ssl_apply_without_url(self):
        with patch.dict(
            os.environ,
            {
                "DATABASE_URL": " ",
                "DB_NAME": "local",
                "DB_USER": "writer",
                "DB_PASSWORD": "pass",
                "DB_HOST": "127.0.0.1",
                "DB_PORT": "5434",
            },
            clear=True,
        ):
            config = database_config(True)["default"]
            plain = database_config()["default"]
        self.assertEqual(config["NAME"], "local")
        self.assertEqual(config["PORT"], "5434")
        self.assertEqual(config["OPTIONS"]["sslmode"], "require")
        self.assertNotIn("OPTIONS", plain)

    def test_fallback_defaults(self):
        with patch.dict(os.environ, {}, clear=True):
            config = database_config()["default"]
        self.assertEqual(config["HOST"], "localhost")
        self.assertEqual(config["NAME"], "default_db_name")

    def test_invalid_url_fails_without_disclosing_credentials(self):
        for url in (
            "bad://writer:private-password@db/name",
            "postgresql://writer:private-password@db:wrong/name",
            "sqlite:///db.sqlite3",
        ):
            with (
                self.subTest(url=url),
                patch.dict(os.environ, {"DATABASE_URL": url}, clear=True),
            ):
                with self.assertRaises(ImproperlyConfigured) as error:
                    database_config()
                self.assertNotIn("private-password", str(error.exception))

    def test_local_postgres_is_default_and_sqlite_requires_explicit_selection(self):
        with patch.dict(
            os.environ, {"DATABASE_URL": "postgresql://test:test@db/app"}, clear=True
        ):
            self.assertEqual(
                runpy.run_path(
                    str(Path(__file__).with_name("local.py")), run_name="config.local"
                )["DATABASES"]["default"]["ENGINE"],
                "django.db.backends.postgresql",
            )
            os.environ["LOCAL_DATABASE"] = "sqlite"
            self.assertEqual(
                runpy.run_path(
                    str(Path(__file__).with_name("local.py")), run_name="config.local"
                )["DATABASES"]["default"]["ENGINE"],
                "django.db.backends.sqlite3",
            )
            os.environ["LOCAL_DATABASE"] = "typo"
            with self.assertRaises(ImproperlyConfigured):
                runpy.run_path(
                    str(Path(__file__).with_name("local.py")), run_name="config.local"
                )
