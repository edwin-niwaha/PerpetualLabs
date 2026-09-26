import os
import runpy
from pathlib import Path
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings


class RailwayDeploymentTests(SimpleTestCase):
    def test_gunicorn_uses_assigned_port_without_logging_query_secrets(self):
        with patch.dict(os.environ, {"PORT": "9123", "WEB_CONCURRENCY": "3"}):
            config = runpy.run_path(
                str(Path(__file__).resolve().parents[1] / "gunicorn.conf.py")
            )
        self.assertEqual(config["bind"], "0.0.0.0:9123")
        self.assertEqual(config["workers"], 3)
        self.assertFalse(config["preload_app"])
        self.assertIn("%(U)s", config["access_log_format"])
        self.assertNotIn("%(r)s", config["access_log_format"])
        self.assertNotIn("%(q)s", config["access_log_format"])

    @override_settings(
        ALLOWED_HOSTS=["api.example.com", "healthcheck.railway.app"],
        SECURE_SSL_REDIRECT=True,
        SECURE_REDIRECT_EXEMPT=[r"^health/$"],
    )
    def test_railway_healthcheck_works_without_https_redirect(self):
        response = self.client.get("/health/", HTTP_HOST="healthcheck.railway.app")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
