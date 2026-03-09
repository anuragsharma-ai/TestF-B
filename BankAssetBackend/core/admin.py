from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Asset, AssetHistory, Location, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        (
            "Bank Asset Info",
            {
                "fields": ("role", "phone"),
            },
        ),
    )
    list_display = ("username", "email", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_superuser", "is_active", "groups")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("username",)


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("name", "level", "parent", "is_active")
    list_filter = ("level", "is_active")
    search_fields = ("name", "code")


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ("asset_tag", "name", "status", "location")
    list_filter = ("status", "location")
    search_fields = ("asset_tag", "name", "description")
    autocomplete_fields = ("location",)


@admin.register(AssetHistory)
class AssetHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "asset",
        "action",
        "old_location",
        "new_location",
        "old_status",
        "new_status",
        "changed_at",
    )
    list_filter = ("action", "old_status", "new_status")
    search_fields = ("asset__asset_tag", "asset__name")
