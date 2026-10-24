
from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(
        source="get_notification_type_display",
        read_only=True,
    )

    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "payment",
            "notification_type",
            "notification_type_display",
            "channel",
            "recipient_phone",
            "message",
            "status",
            "attempts",
            "provider_message_id",
            "error_message",
            "sent_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "attempts",
            "provider_message_id",
            "error_message",
            "sent_at",
            "created_at",
            "updated_at",
        ]


class HolidayAnnouncementSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=150)
    message = serializers.CharField()
