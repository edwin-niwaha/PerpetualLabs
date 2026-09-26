from django.core.validators import RegexValidator, URLValidator
from django.db import models


class SiteSettings(models.Model):
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    name = models.CharField(max_length=120, default="Perpetual Labs")
    location = models.CharField(max_length=180, default="Kampala, Uganda")
    founded = models.CharField(
        max_length=4,
        default="2020",
        validators=[RegexValidator(r"^\d{4}$", "Use a four-digit year.")],
    )
    phone = models.CharField(
        max_length=40,
        default="+256 703 163 074",
        validators=[RegexValidator(r"^[+\d ()-]+$", "Use a phone number.")],
    )
    email = models.EmailField(default="hello.perpetuallabs@gmail.com", max_length=254)
    whatsapp = models.URLField(
        default="https://wa.me/256703163074",
        validators=[URLValidator(schemes=["https"])],
    )
    introduction = models.TextField(max_length=2000)
    mission = models.TextField(max_length=2000)
    vision = models.TextField(max_length=2000)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Site settings"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(id=1), name="single_site_settings"
            )
        ]

    def __str__(self):
        return self.name


class PageSection(models.Model):
    key = models.SlugField(
        unique=True,
        choices=[
            (key, label)
            for key, label in [
                ("home-hero", "Home / Galaxy hero"),
                ("home-services", "Home / Services"),
                ("home-products", "Home / Products"),
                ("home-approach", "Home / Approach"),
                ("sign-in", "Sign in"),
                ("about", "About introduction"),
                ("contact", "Contact introduction"),
                ("cta", "Contact invitation"),
            ]
        ],
    )
    eyebrow = models.CharField(max_length=180)
    title = models.TextField(
        max_length=300, help_text="Line breaks are preserved in display headings."
    )
    description = models.TextField(max_length=2000, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["key"]

    def __str__(self):
        return self.get_key_display()


class PublishedItem(models.Model):
    sort_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["sort_order", "id"]


class FAQ(PublishedItem):
    question = models.CharField(max_length=250)
    answer = models.TextField(max_length=3000)

    class Meta(PublishedItem.Meta):
        verbose_name = "FAQ"

    def __str__(self):
        return self.question


class Feature(PublishedItem):
    group = models.CharField(
        max_length=20,
        choices=[("approach", "Our approach"), ("values", "Company values")],
    )
    title = models.CharField(max_length=180)
    description = models.TextField(max_length=2000)

    def __str__(self):
        return self.title
