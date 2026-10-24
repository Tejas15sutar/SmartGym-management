
from django.db import models
from django.conf import settings


class Payment(models.Model):

    PAYMENT_METHOD_CHOICES = [
        ("CASH", "Cash"),
        ("UPI", "UPI"),
        ("CARD", "Card"),
        ("ONLINE", "Online"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("SUCCESSFUL", "Successful"),
        ("FAILED", "Failed"),
    ]

    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="payments"
    )

    membership = models.ForeignKey(
        "memberships.Membership",
        on_delete=models.PROTECT,
        related_name="payments"
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default="PENDING"
    )

    transaction_id = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True
    )

    payment_date = models.DateTimeField(
        null=True,
        blank=True
    )

    notes = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.member.username} - ₹{self.amount} - {self.payment_status}"
