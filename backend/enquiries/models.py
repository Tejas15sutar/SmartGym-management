from django.db import models

# Create your models here.

from django.db import models


class Enquiry(models.Model):
    STATUS_CHOICES = [
        ("NEW", "New"),
        ("CONTACTED", "Contacted"),
        ("VISIT_SCHEDULED", "Visit Scheduled"),
        ("CONVERTED", "Converted"),
        ("NOT_INTERESTED", "Not Interested"),
    ]

    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    interested_plan = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="NEW",
    )
    follow_up_date = models.DateField(blank=True, null=True)
    notes = models.TextField(blank=True)
    converted_member = models.ForeignKey(
        "members.Member",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="source_enquiries",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.phone}"
