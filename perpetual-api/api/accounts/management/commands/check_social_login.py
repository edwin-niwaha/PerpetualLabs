"""Print safe OAuth setup details without revealing credentials."""

from django.conf import settings
from django.core.management.base import BaseCommand

from api.accounts.social import configured


class Command(BaseCommand):
    help = "Check environment selection and print the exact Google Console URLs."

    def handle(self, *args, **options):
        self.stdout.write(f"Environment: {settings.DJANGO_ENV}")
        self.stdout.write(f"API origin: {settings.SITE_URL}")
        self.stdout.write(f"Frontend / JavaScript origin: {settings.FRONTEND_URL}")
        self.stdout.write(f"Authorized redirect URI: {settings.GOOGLE_REDIRECT_URI}")
        self.stdout.write(f"Client ID configured: {bool(settings.GOOGLE_CLIENT_ID)}")
        self.stdout.write(
            f"Client secret configured: {bool(settings.GOOGLE_CLIENT_SECRET)}"
        )
        self.stdout.write(
            "Google login: enabled"
            if configured()
            else "Google login: disabled until both credentials are configured"
        )
