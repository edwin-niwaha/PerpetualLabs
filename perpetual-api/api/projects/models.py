from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def clean(self):
        if not self.name.strip():
            raise ValidationError("Category name cannot be empty.")

    def save(self, *args, **kwargs):
        self.full_clean()  # Ensures validation before saving
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Client(models.Model):
    name = models.CharField(max_length=255)

    def clean(self):
        if not self.name.strip():
            raise ValidationError("Client name cannot be empty.")

    def __str__(self):
        return self.name


class Project(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    detail = models.TextField(blank=True, null=True)
    client = models.ForeignKey(
        Client, on_delete=models.SET_NULL, null=True, related_name="projects"
    )
    technologies = models.JSONField(default=list)
    completion_date = models.DateField()
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name="projects"
    )
    image = models.URLField()
    website_url = models.URLField(blank=True, null=True)
    slug = models.SlugField(unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if not self.title.strip():
            raise ValidationError("Project title cannot be empty.")
        if not self.client:
            raise ValidationError("Project must have a client assigned.")
        if not self.completion_date:
            raise ValidationError("Project must have a completion date.")
        if self.image and not self.image.startswith("http"):
            raise ValidationError('Image URL must start with "http" or "https".')

    def save(self, *args, **kwargs):
        self.clean()  # Custom validation
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ["-completion_date"]


class Product(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, null=True, blank=True)
    image = models.ImageField(upload_to="products/", blank=True)
    image_alt = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    detail = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    website_url = models.URLField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("live", "Live"),
            ("development", "In development"),
            ("available", "Available"),
        ],
        default="available",
    )
    focus = models.JSONField(default=list, blank=True)
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)[:40] or "product"
            candidate, counter = base, 2
            while Product.objects.exclude(pk=self.pk).filter(slug=candidate).exists():
                candidate = f"{base}-{counter}"
                counter += 1
            self.slug = candidate
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class SiteVisual(models.Model):
    key = models.SlugField(unique=True)
    image = models.ImageField(upload_to="site/")
    alt = models.CharField(max_length=255)
    credit = models.CharField(max_length=500, blank=True)
    source_url = models.URLField(blank=True)

    def __str__(self):
        return self.key
