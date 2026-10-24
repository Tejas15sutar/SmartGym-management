from django.conf import settings
from django.db import models


class Attendance(models.Model):

    STATUS_CHOICES = [
        ("PRESENT", "Present"),
        ("ABSENT", "Absent"),
    ]

    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="attendance_records",
        limit_choices_to={"role": "MEMBER"},
    )

    date = models.DateField()

    check_in = models.DateTimeField(
        null=True,
        blank=True
    )

    check_out = models.DateTimeField(
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="PRESENT"
    )

    notes = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-date", "-check_in"]
        constraints = [
            models.UniqueConstraint(
                fields=["member", "date"],
                name="unique_member_attendance_per_day"
            )
        ]

    def __str__(self):
        return f"{self.member.username} - {self.date} - {self.status}"