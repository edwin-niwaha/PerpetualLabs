"""Create/remove temporary local-only content editor test accounts."""
import json, os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "perpetual-api"))
os.environ["DJANGO_SETTINGS_MODULE"] = "config.local"
import django
django.setup()
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from api.home.models import FAQ
operation, username = sys.argv[1:3]
if not username.startswith("e2e-content-"):
    raise ValueError("Only temporary content test accounts are allowed")
if operation == "create":
    user = get_user_model().objects.create_user(username=username, email=f"{username}@example.test", password=sys.argv[3], is_staff=True)
    print(json.dumps({"access": str(RefreshToken.for_user(user).access_token)}))
elif operation == "cleanup":
    from api.accounts.models import TeamMember
    TeamMember.objects.filter(name=username).delete()
    FAQ.objects.filter(question=f"{username} question").delete()
    get_user_model().objects.filter(username=username).delete()
else:
    raise ValueError("Unknown operation")
