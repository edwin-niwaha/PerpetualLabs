from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Contact, TeamMember, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ("username", "email", "first_name", "last_name", "is_staff")
    list_filter = ("is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("username",)

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            "Personal Info",
            {"fields": ("first_name", "last_name", "email", "date_of_birth", "bio")},
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important Dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("username", "email", "password1", "password2"),
            },
        ),
    )


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "created_at")
    search_fields = ("name", "email", "user_message")
    readonly_fields = ("created_at",)


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "position", "image")
    search_fields = ("name", "position")
    list_filter = ("position",)

    def get_export_fields(self, request):
        return ("id", "name", "position", "image")
