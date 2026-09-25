"""Temporary local-only fixtures for browser integration tests."""
import os
import sys
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[2] / "perpetual-api"
sys.path.insert(0, str(API_ROOT))
os.environ["DJANGO_SETTINGS_MODULE"] = "config.local"
import django
django.setup()
from django.contrib.auth import get_user_model
from api.services.models import Service
from api.projects.models import Client, Project
from api.blog.models import BlogPost, Category

slug = "e2e-integration-fixture"
if sys.argv[1] == "seed":
    author, _ = get_user_model().objects.get_or_create(username="e2e_content_author", defaults={"email": "e2e_content@example.test"})
    category, _ = Category.objects.get_or_create(slug=slug, defaults={"name": "Integration fixture"})
    client, _ = Client.objects.get_or_create(name="E2E fixture client")
    Service.objects.update_or_create(slug=slug, defaults={"title": "Integration test service", "description": "Service details from the real local Django API.", "icon": "code"})
    Project.objects.update_or_create(slug=slug, defaults={"title": "Integration test project", "description": "Project summary from Django.", "detail": "Project detail from Django.", "client": client, "technologies": ["Next.js", "Django"], "completion_date": "2026-01-01", "image": "https://example.com/test.png"})
    BlogPost.objects.update_or_create(slug=slug, defaults={"title": "Integration test article", "excerpt": "Article excerpt from Django.", "content": "Article content from Django. <script>window.injected=true</script>", "author": author, "category": category, "image": "https://example.com/test.png", "is_published": True})
else:
    Service.objects.filter(slug=slug).delete()
    Project.objects.filter(slug=slug).delete()
    BlogPost.objects.filter(slug=slug).delete()
    Category.objects.filter(slug=slug).delete()
    Client.objects.filter(name="E2E fixture client").delete()
    get_user_model().objects.filter(username="e2e_content_author").delete()
