
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import Notification


def process_notification(notification_id):
    """
    Process one queued notification.

    WhatsApp delivery remains disabled until API credentials
    and the provider integration are configured.
    """

    with transaction.atomic():
        try:
            notification = (
                Notification.objects
                .select_for_update()
                .get(id=notification_id)
            )
        except Notification.DoesNotExist:
            return {
                "success": False,
                "detail": "Notification not found.",
            }

        if notification.status == "SENT":
            return {
                "success": True,
                "detail": "Notification was already sent.",
            }

        if notification.status == "PROCESSING":
            return {
                "success": False,
                "detail": "Notification is already processing.",
            }

        if notification.status != "PENDING":
            return {
                "success": False,
                "detail": (
                    f"Cannot process notification with status "
                    f"{notification.status}."
                ),
            }

        notification.status = "PROCESSING"
        notification.attempts += 1
        notification.error_message = ""
        notification.save(
            update_fields=[
                "status",
                "attempts",
                "error_message",
                "updated_at",
            ]
        )

        # WhatsApp delivery is intentionally disabled for now.
        # Do not mark the notification SENT until a provider
        # confirms that the message was accepted.
        notification.status = "PENDING"
        notification.error_message = (
            "WhatsApp delivery is not configured yet."
        )
        notification.save(
            update_fields=[
                "status",
                "error_message",
                "updated_at",
            ]
        )

        return {
            "success": False,
            "detail": (
                "Notification remains pending because WhatsApp "
                "delivery is not configured."
            ),
            "notification_id": notification.id,
            "attempts": notification.attempts,
        }
