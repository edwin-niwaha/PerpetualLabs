import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.utils import timezone
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=280, unique=True, blank=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def clean(self):
        if not self.name.strip():
            raise ValidationError("Category name cannot be empty or whitespace.")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = (slugify(self.name) or "topic") + "-" + uuid.uuid4().hex[:10]
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class BlogPost(models.Model):
    cover_image = models.ImageField(upload_to="journal/", blank=True)
    title = models.CharField(max_length=255)
    excerpt = models.TextField()
    content = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="posts"
    )
    image = models.URLField(blank=True)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def clean(self):
        if not self.title.strip():
            raise ValidationError("Blog post title cannot be empty or whitespace.")
        if not self.excerpt.strip():
            raise ValidationError("Excerpt cannot be empty or whitespace.")
        if not self.content.strip():
            raise ValidationError("Content cannot be empty or whitespace.")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = (
                (slugify(self.title)[:250] or "entry") + "-" + uuid.uuid4().hex[:10]
            )
        if self.is_published and not self.published_at:
            self.published_at = timezone.now()
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email

    @classmethod
    def subscribe(cls, email):
        # A uniform response prevents disclosure of existing subscriptions.
        email = email.strip().lower()
        subscriber, created = cls.objects.get_or_create(
            email__iexact=email, defaults={"email": email}
        )
        if created:
            transaction.on_commit(lambda: cls.send_subscription_email(subscriber))
        return (
            subscriber,
            True,
            "Thank you. Your subscription request has been received.",
        )

    @classmethod
    def send_subscription_email(cls, subscriber):
        from api.notifications import send_subscription_email

        send_subscription_email(subscriber)
