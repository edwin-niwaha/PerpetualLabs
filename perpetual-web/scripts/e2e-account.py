"""Isolated browser fixtures/server. Never uses live data or an external mail backend."""
import json
import os
from pathlib import Path
import secrets
import sys
import uuid

root = Path(__file__).resolve().parents[2] / "perpetual-api"
sys.path.insert(0, str(root))
os.environ["DJANGO_SETTINGS_MODULE"] = "config.local"
os.environ["DJANGO_ENV"] = "development"
os.environ["LOCAL_DATABASE"] = "sqlite"
import django
from django.conf import settings

settings.DATABASES["default"]["NAME"] = root / "account-e2e.sqlite3"
settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
settings.FRONTEND_URL = "http://localhost:3002"
settings.MEDIA_ROOT = root / "media" / "account-e2e"
settings.WHITENOISE_AUTOREFRESH = True
# Keep all throttling and mail delivery inside this isolated test process.
settings.CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
django.setup()
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.management import call_command
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

User = get_user_model()
command = sys.argv[1]
if command == "init":
    call_command("migrate", interactive=False, verbosity=0)
elif command == "serve":
    call_command("runserver", "127.0.0.1:8002", use_reloader=False)
elif command == "create":
    username = "account_e2e_" + uuid.uuid4().hex[:12]
    password = secrets.token_urlsafe(24)
    User.objects.create_user(username=username, email=username + "@example.test", password=password)
    print(json.dumps({"username": username, "password": password}))
elif command in {"token", "cleanup"}:
    username = sys.argv[2]
    if not username.startswith("account_e2e_"):
        raise SystemExit("Refusing to access a non-test account.")
    user = User.objects.get(username=username)
    if command == "token":
        print(json.dumps({"uid": urlsafe_base64_encode(force_bytes(user.pk)), "token": default_token_generator.make_token(user)}))
    else:
        if user.profile_picture:
            user.profile_picture.delete(save=False)
        user.delete()
