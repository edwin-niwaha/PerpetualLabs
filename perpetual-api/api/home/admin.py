from django.contrib import admin

from .models import FAQ, Feature, PageSection, SiteSettings


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    readonly_fields = ["updated_at"]

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists() and super().has_add_permission(request)

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(PageSection)
class PageSectionAdmin(admin.ModelAdmin):
    list_display = ["key", "eyebrow", "updated_at"]
    readonly_fields = ["updated_at"]

    def get_readonly_fields(self, request, obj=None):
        return ["updated_at", "key"] if obj else ["updated_at"]


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ["question", "sort_order", "is_published"]
    list_editable = ["sort_order", "is_published"]
    search_fields = ["question", "answer"]
    list_filter = ["is_published"]


@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ["title", "group", "sort_order", "is_published"]
    list_editable = ["sort_order", "is_published"]
    list_filter = ["group", "is_published"]
