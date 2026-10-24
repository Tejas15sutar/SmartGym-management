
from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "notification_type",
        "recipient_phone",
        "channel",
        "status",
        "attempts",
        "created_at",
        "sent_at",
    )

    list_filter = (
        "notification_type",
        "channel",
        "status",
    )

    search_fields = (
        "recipient_phone",
        "message",
        "provider_message_id",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
        "sent_at",
        "provider_message_id",
        "error_message",
        "attempts",
    )
