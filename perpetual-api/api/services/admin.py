from django.contrib import admin

from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "created_at")
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}
    ordering = ("-created_at",)
