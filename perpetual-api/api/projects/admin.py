from django.contrib import admin

from .models import Category, Client, Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "client", "website_url", "completion_date", "slug")
    search_fields = ("title", "client__name", "description")
    prepopulated_fields = {"slug": ("title",)}
    ordering = ("-created_at",)


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)
    ordering = ("name",)
