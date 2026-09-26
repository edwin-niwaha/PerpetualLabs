from django.contrib import admin

from .models import Category, Client, Product, Project, SiteVisual


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


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "is_featured", "is_published", "sort_order")
    list_editable = ("is_featured", "is_published", "sort_order")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "description")


@admin.register(SiteVisual)
class SiteVisualAdmin(admin.ModelAdmin):
    list_display = ("key", "alt")
