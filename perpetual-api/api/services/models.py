from django.db import models
from django.utils.text import slugify


class Service(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Service"
        verbose_name_plural = "Services"
        
