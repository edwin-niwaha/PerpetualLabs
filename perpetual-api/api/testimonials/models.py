from django.core.exceptions import ValidationError
from django.db import models

from api.projects.models import Client


class Testimonial(models.Model):
    name = models.CharField(max_length=255)
    position = models.CharField(max_length=255)
    client = models.ForeignKey(
        Client, on_delete=models.SET_NULL, null=True, related_name="testimonials"
    )
    content = models.TextField()
    image = models.URLField(blank=True)
    portrait = models.ImageField(upload_to="testimonials/", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.position})"

    def clean(self):
        if not self.name.strip():
            raise ValidationError({"name": "Name cannot be blank."})

        if not self.position.strip():
            raise ValidationError({"position": "Position cannot be blank."})

        if not self.content.strip():
            raise ValidationError({"content": "Content cannot be blank."})

        if self.image and not self.image.startswith(("http://", "https://")):
            raise ValidationError(
                {"image": "Image URL must start with http:// or https://."}
            )
