"""Local-only browser fixtures; never calls an email-sending function."""
import json
import os
from pathlib import Path
import secrets
import sys
import uuid

root = Path(__file__).resolve().parents[2] / "perpetual-api"
sys.path.insert(0, str(root))
os.environ["DJANGO_SETTINGS_MODULE"] = "config.local"
import django
django.setup()
from django.conf import settings
from django.contrib.auth import get_user_model
from api.accounts.models import EmailDelivery, PortalNotification

assert settings.DATABASES["default"]["ENGINE"] == "django.db.backends.sqlite3"
User = get_user_model()
if sys.argv[1] == "create":
    username = "portal_e2e_" + uuid.uuid4().hex[:12]
    password = secrets.token_urlsafe(24)
    user = User.objects.create_user(username=username, email=username + "@example.test", password=password)
    PortalNotification.objects.create(user=user, title="Your private project update", body="Your consultation notes are ready in your private workspace.")
    EmailDelivery.objects.create(user=user, recipient=user.email, deduplication_key="e2e:" + username,
        subject="Portal test email", body="A private email copy.", html="<p>A private email copy.</p>", status="failed")
    print(json.dumps({"username": username, "password": password}))
elif sys.argv[1] == "cleanup":
    username = sys.argv[2]
    if not username.startswith("portal_e2e_"):
        raise SystemExit("Refusing to remove a non-test account.")
    user = User.objects.get(username=username)
    EmailDelivery.objects.filter(user=user).delete()
    user.delete()
