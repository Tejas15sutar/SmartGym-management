
from datetime import datetime, time, timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class TrainerAttendance(models.Model):

    trainer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trainer_attendance_records",
        limit_choices_to={"role": "TRAINER"},
    )

    date = models.DateField(default=timezone.localdate)

    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)

    auto_checked_out = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-check_in"]
        constraints = [
            models.UniqueConstraint(
                fields=["trainer", "date"],
                name="unique_trainer_attendance_per_day",
            ),
        ]

    def __str__(self):
        return f"{self.trainer.username} - {self.date}"

    @property
    def duration_seconds(self):
        if not self.check_in or not self.check_out:
            return None

        return max(
            0,
            int((self.check_out - self.check_in).total_seconds()),
        )

    def automatic_check_out(self):
        """
        Automatically close attendance at 10:00 PM
        on the attendance date.
        """

        if not self.check_in or self.check_out:
            return False

        closing_time = timezone.make_aware(
            datetime.combine(self.date, time(22, 0)),
            timezone.get_current_timezone(),
        )

        self.check_out = closing_time
        self.auto_checked_out = True

        self.save(
            update_fields=["check_out", "auto_checked_out"]
        )

        return True
