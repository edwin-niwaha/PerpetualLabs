from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.mail import EmailMessage
from django.db import models
from django.utils.html import strip_tags
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def clean(self):
        if not self.name.strip():
            raise ValidationError("Category name cannot be empty or whitespace.")

    def save(self, *args, **kwargs):
        self.full_clean()  # Ensures validation before saving
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class BlogPost(models.Model):
    title = models.CharField(max_length=255)
    excerpt = models.TextField()
    content = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name="posts"
    )
    image = models.URLField()
    slug = models.SlugField(unique=True, blank=True)
    is_published = models.BooleanField(default=False)
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
        self.full_clean()  # Validate fields before saving
        if not self.slug:
            self.slug = slugify(self.title)
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
        if not email:
            return None, False, "Email is required."

        if cls.objects.filter(email=email).exists():
            return None, False, "This email is already subscribed."

        subscriber = cls.objects.create(email=email)
        cls.send_subscription_email(subscriber)
        return subscriber, True, "You have successfully subscribed to our newsletter!"

    @classmethod
    def send_subscription_email(cls, subscriber):
        from_email = settings.EMAIL_HOST_USER
        recipient_user = [subscriber.email]
        admin_email = [settings.DEFAULT_FROM_EMAIL]  # or use settings.ADMINS[0][1]

        # Email to the user
        subject_user = f"Thank you for subscribing, {subscriber.email}!"
        html_message_user = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #4CAF50;">Hello, {subscriber.email}</h2>
                <p>Thank you so much for subscribing to our newsletter! We’ve added your email to our list, and you’ll receive the latest updates and promotions from us.</p>

                <p>Here’s a summary of your subscription:</p>
                <blockquote style="font-style: italic; border-left: 3px solid #4CAF50; padding-left: 15px;">
                    Email: {subscriber.email}
                </blockquote>

                <p>We look forward to keeping you informed with the best content we have to offer.</p>

                <br>
                <p>Best regards,</p>
                <p><strong>The Newsletter Team</strong></p>
                <p><em>Perpetual Tech</em></p>
                <p><em>Tel: +256 703-163-074</em></p>
            </body>
        </html>
        """
        EmailMessage(
            subject=subject_user,
            body=strip_tags(html_message_user),
            from_email=from_email,
            to=recipient_user,
            headers={"Content-Type": "text/html"},
        ).send(fail_silently=True)

        # Email to the host/admin
        subject_host = f"New Subscriber: {subscriber.email}"
        html_message_host = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #FF5722;">New Newsletter Subscriber</h2>
                <p><strong>Email:</strong> {subscriber.email}</p>
                <p><strong>Subscription Date:</strong> {subscriber.subscribed_at}</p>
                <br>
                <p>This is a notification that someone has joined your newsletter list.</p>
                <p><em>— Newsletter System</em></p>
            </body>
        </html>
        """
        EmailMessage(
            subject=subject_host,
            body=strip_tags(html_message_host),
            from_email=from_email,
            to=admin_email,
            headers={"Content-Type": "text/html"},
        ).send(fail_silently=True)
