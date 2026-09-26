"""Temporary local journal fixtures; never sends email."""
import json, os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "perpetual-api"))
os.environ["DJANGO_SETTINGS_MODULE"] = "config.local"
import django
django.setup()
from django.contrib.auth import get_user_model
from api.blog.models import BlogPost, Category
from rest_framework_simplejwt.tokens import RefreshToken
operation, username = sys.argv[1:3]
if not username.startswith("e2e-journal-"):
    raise ValueError("Temporary fixture accounts only")
if operation == "create":
    user = get_user_model().objects.create_user(username=username,email=f"{username}@example.test",password=sys.argv[3],is_staff=True)
    category=Category.objects.create(name=username)
    titles=["Small improvements, lasting impact", "What a week of listening taught us", "Making room for better questions", "Building with the people who use it", "A quieter approach to good design", "The value of starting small", "Notes from a day in the studio"]
    for index,title in enumerate(titles):
        BlogPost.objects.create(title=title,excerpt="A note on the decisions, discoveries, and everyday work that help us build more useful technology.",content="## A little progress\n\nGood work begins with listening. Here is what we learned today.\n\n- Start with a question\n- Make something useful\n\n<script>window.journalInjected=true</script>",author=user,category=category,is_published=True)
    tokens=RefreshToken.for_user(user)
    print(json.dumps({"access":str(tokens.access_token),"refresh":str(tokens),"topic":category.name}))
elif operation == "cleanup":
    get_user_model().objects.filter(username=username).delete()
    Category.objects.filter(name=username,posts__isnull=True).delete()
else:
    raise ValueError("Unknown operation")
