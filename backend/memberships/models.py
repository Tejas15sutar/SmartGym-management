
from django.db import models
from django.utils import timezone
from django.conf import settings
from datetime import timedelta


class MembershipPlan(models.Model):

    PLAN_CHOICES = [
        ("MONTHLY", "Monthly"),
        ("QUARTERLY", "Quarterly"),
        ("HALF_YEARLY", "Half Yearly"),
        ("YEARLY", "Yearly"),
    ]

    name = models.CharField(max_length=100, unique=True)
    plan_type = models.CharField(
        max_length=20,
        choices=PLAN_CHOICES
    )
    duration_days = models.PositiveIntegerField()
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Membership(models.Model):

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("ACTIVE", "Active"),
        ("EXPIRED", "Expired"),
        ("CANCELLED", "Cancelled"),
    ]

    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships"
    )

    plan = models.ForeignKey(
        MembershipPlan,
        on_delete=models.PROTECT,
        related_name="memberships"
    )

    start_date = models.DateField()
    end_date = models.DateField()

    amount_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def remaining_days(self):
        if self.status != "ACTIVE":
            return 0

        return max(
            (self.end_date - timezone.localdate()).days + 1,
            0
        )

    def __str__(self):
        return f"{self.member.username} - {self.plan.name}"
