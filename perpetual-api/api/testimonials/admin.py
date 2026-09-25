from django.contrib import admin

from .models import Testimonial


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "position", "client_name", "content", "image")
    search_fields = ("name", "client__name")
    list_filter = ("position",)

    def client_name(self, obj):
        return obj.client.name if obj.client else "-"

    client_name.short_description = "Client"

    def get_export_fields(self, request):
        return ("id", "name", "position", "client_name", "content", "image")
