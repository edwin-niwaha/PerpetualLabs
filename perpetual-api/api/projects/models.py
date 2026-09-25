from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify
from rest_framework.permissions import IsAuthenticated, AllowAny


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
    image = models.ImageField(upload_to='products/')
    
    def __str__(self):
        return self.name
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]