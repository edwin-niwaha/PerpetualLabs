from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html

from .models import (
    Contact,
    EmailDelivery,
    PortalNotification,
    PortalService,
    TeamMember,
    User,
)


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


class TeamMemberAdminForm(forms.ModelForm):
    remove_picture = forms.BooleanField(
        required=False,
        label="Remove picture",
        help_text="Remove the current upload and image URL. The website will show initials.",
    )

    class Meta:
        model = TeamMember
        fields = ("name", "position", "portrait", "image")
        widgets = {
            "portrait": forms.FileInput(
                attrs={"accept": "image/jpeg,image/png,image/webp"}
            )
        }
        labels = {"portrait": "Upload picture", "image": "Image URL (optional)"}
        help_texts = {
            "portrait": "Add or replace a portrait with a JPG, PNG or WebP, up to 8 MB.",
            "image": "Optional Cloudinary HTTPS URL. An uploaded picture takes priority.",
        }

    def clean_portrait(self):
        portrait = self.cleaned_data.get("portrait")
        if "portrait" in self.files:
            if portrait.size > 8 * 1024 * 1024:
                raise forms.ValidationError("Pictures must be 8 MB or smaller.")
            if portrait.image.format not in {
                "JPEG",
                "PNG",
                "WEBP",
            } or not portrait.name.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                raise forms.ValidationError("Use a JPG, PNG or WebP picture.")
        return portrait

    def clean(self):
        data = super().clean()
        if data.get("remove_picture"):
            if "portrait" in self.files:
                self.add_error(
                    "portrait", "Choose either a new picture or Remove picture."
                )
            data["portrait"] = False
            data["image"] = ""
        return data


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    form = TeamMemberAdminForm
    list_display = ("name", "position", "picture_preview")
    search_fields = ("name", "position")
    list_filter = ("position",)
    readonly_fields = ("picture_preview",)
    fields = (
        "name",
        "position",
        "picture_preview",
        "portrait",
        "image",
        "remove_picture",
    )

    @admin.display(description="Current picture")
    def picture_preview(self, member):
        url = member.portrait.url if member.portrait else member.image
        if not url:
            return "No picture — initials are shown on the website."
        return format_html(
            '<img src="{}" alt="{}" style="width:88px;height:88px;object-fit:cover;border-radius:8px">',
            url,
            member.name,
        )




@admin.register(EmailDelivery)
class EmailDeliveryAdmin(admin.ModelAdmin):
    list_display = (
        "subject",
        "recipient",
        "audience",
        "status",
        "attempts",
        "created_at",
    )
    list_filter = ("status", "audience")
    search_fields = ("recipient", "subject", "provider_id")
    readonly_fields = tuple(field.name for field in EmailDelivery._meta.fields)
    actions = ["retry_failed"]

    def has_add_permission(self, request):
        return False

    @admin.action(description="Retry selected pending or failed email notifications")
    def retry_failed(self, request, queryset):
        from api.notifications import send_delivery

        accepted = sum(
            send_delivery(record.pk)
            for record in queryset.filter(status__in=["pending", "failed"])
        )
        self.message_user(
            request,
            f"{accepted} notification(s) accepted for delivery. Check each record for failures.",
        )


@admin.register(PortalNotification)
class PortalNotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "email_requested", "read_at", "created_at")
    list_filter = ("email_requested",)
    search_fields = ("title", "user__username", "user__email")
    autocomplete_fields = ("user",)
    readonly_fields = ("read_at", "created_at")

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ("user", "title", "body", "email_requested")
        return self.readonly_fields


@admin.register(PortalService)
class PortalServiceAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "is_published", "sort_order")
    list_editable = ("status", "is_published", "sort_order")
