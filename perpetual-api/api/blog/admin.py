from django.contrib import admin

from .models import BlogPost, Category, NewsletterSubscriber


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "is_published", "published_at", "category")
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("title", "author__username", "category__name")
    list_filter = ("is_published", "category", "published_at")
    date_hierarchy = "published_at"


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "subscribed_at")
    search_fields = ("email",)
    list_filter = ("subscribed_at",)
