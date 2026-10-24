
from django.conf import settings
from django.db import models


class Notification(models.Model):

    TYPE_CHOICES = [
        ("PAYMENT_RECEIPT", "Payment Receipt"),
        ("EXPIRY_REMINDER", "Membership Expiry Reminder"),
        ("HOLIDAY_ANNOUNCEMENT", "Holiday Announcement"),
    ]

    CHANNEL_CHOICES = [
        ("WHATSAPP", "WhatsApp"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("PROCESSING", "Processing"),
        ("SENT", "Sent"),
        ("FAILED", "Failed"),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    # Optional link to the payment that triggered the notification.
    payment = models.ForeignKey(
        "payments.Payment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=30,
        choices=TYPE_CHOICES,
    )

    channel = models.CharField(
        max_length=20,
        choices=CHANNEL_CHOICES,
        default="WHATSAPP",
    )

    recipient_phone = models.CharField(max_length=20)
    message = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING",
        db_index=True,
    )

    attempts = models.PositiveIntegerField(default=0)
    provider_message_id = models.CharField(
        max_length=255,
        blank=True,
    )
    error_message = models.TextField(blank=True)

    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.get_notification_type_display()} - "
            f"{self.recipient_phone} - {self.status}"
        )
