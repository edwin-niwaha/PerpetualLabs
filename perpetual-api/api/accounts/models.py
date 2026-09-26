import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from api.notifications import send_contact_email


class User(AbstractUser):
    # Adding extra fields
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50, null=True, blank=True)
    last_name = models.CharField(max_length=50, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to="profiles/", blank=True)

    def __str__(self):
        return self.username


class Contact(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="inquiries",
    )
    name = models.CharField(max_length=255)
    email = models.EmailField()
    user_message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Contact from {self.name}"


@receiver(post_save, sender=Contact)
def contact_post_save(sender, instance, created, raw=False, **kwargs):
    if created and not raw:
        transaction.on_commit(lambda: send_contact_email(instance))


# Define the positions as specified
POSITION_CHOICES = [
    ("lead_developer", "Lead Developer"),
    ("security_specialist", "Security Specialist"),
    ("ceo_founder", "CEO & Founder"),
    ("cto", "CTO"),
    ("marketing_officer", "Marketing Officer"),
]


class TeamMember(models.Model):
    name = models.CharField(max_length=255)
    position = models.CharField(
        max_length=255, choices=POSITION_CHOICES, default="lead_developer"
    )
    image = models.URLField(blank=True)
    portrait = models.ImageField(upload_to="team/", blank=True)

    def __str__(self):
        return self.name

    def clean(self):
        if not self.name.strip():
            raise ValidationError({"name": "Name cannot be blank."})

        if not self.position.strip():
            raise ValidationError({"position": "Position cannot be blank."})

        if self.image and not self.image.startswith(("http://", "https://")):
            raise ValidationError(
                {"image": "Image URL must start with http:// or https://."}
            )


class PortalNotification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=200)
    body = models.TextField(max_length=5000)
    email_requested = models.BooleanField(
        default=False,
        help_text="Also send this notification to the client's account email.",
    )
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return self.title


class EmailDelivery(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENDING = "sending", "Sending"
        ACCEPTED = "accepted", "Accepted by email provider"
        FAILED = "failed", "Needs attention"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="email_deliveries",
    )
    contact = models.ForeignKey(
        Contact,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="email_deliveries",
    )
    deduplication_key = models.CharField(max_length=160, unique=True)
    idempotency_key = models.UUIDField(default=uuid.uuid4, editable=False)
    recipient = models.EmailField()
    subject = models.CharField(max_length=200)
    body = models.TextField()
    html = models.TextField()
    reply_to = models.EmailField(blank=True)
    audience = models.CharField(
        max_length=16,
        choices=[("client", "Client"), ("team", "Team")],
        default="client",
    )
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING
    )
    provider_id = models.CharField(max_length=200, blank=True)
    last_error = models.CharField(max_length=200, blank=True)
    attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.subject} ({self.status})"


class PortalService(models.Model):
    title = models.CharField(max_length=120)
    description = models.TextField(max_length=1000)
    status = models.CharField(
        max_length=16,
        choices=[("available", "Available"), ("coming_soon", "Coming soon")],
        default="coming_soon",
    )
    is_published = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.title


@receiver(post_save, sender=PortalNotification)
def notification_post_save(sender, instance, created, raw=False, **kwargs):
    if created and not raw and instance.email_requested:
        from api.notifications import send_portal_notification

        transaction.on_commit(lambda: send_portal_notification(instance))


class SocialIdentity(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="social_identities",
    )
    provider = models.CharField(max_length=20, default="google")
    subject = models.CharField(max_length=255)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "subject"], name="unique_social_identity"
            )
        ]


class SocialLoginAttempt(models.Model):
    state = models.CharField(max_length=128, unique=True)
    nonce = models.CharField(max_length=128)
    code_verifier = models.CharField(max_length=128)
    browser_challenge = models.CharField(max_length=64)
    expires_at = models.DateTimeField(db_index=True)
    consumed = models.BooleanField(default=False)
