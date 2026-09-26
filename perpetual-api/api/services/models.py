from django.db import models
from django.utils.text import slugify


class Service(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    highlights = models.JSONField(default=list, blank=True)
    icon = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:40] or "service"
            candidate, counter = base, 2
            while Service.objects.exclude(pk=self.pk).filter(slug=candidate).exists():
                candidate = f"{base}-{counter}"
                counter += 1
            self.slug = candidate
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Service"
        verbose_name_plural = "Services"
