from django.conf import settings
from django.db import models


class Member(models.Model):

    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        OTHER = "OTHER", "Other"

    class FitnessGoal(models.TextChoices):
        WEIGHT_LOSS = "WEIGHT_LOSS", "Weight Loss"
        MUSCLE_GAIN = "MUSCLE_GAIN", "Muscle Gain"
        FITNESS = "FITNESS", "General Fitness"
        STRENGTH = "STRENGTH", "Strength"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="member_profile"
    )

    date_of_birth = models.DateField(
        null=True,
        blank=True
    )

    gender = models.CharField(
        max_length=10,
        choices=Gender.choices,
        blank=True
    )

    address = models.TextField(
        blank=True
    )

    emergency_contact_name = models.CharField(
        max_length=100,
        blank=True
    )

    emergency_contact_phone = models.CharField(
        max_length=15,
        blank=True
    )

    height = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )

    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )

    fitness_goal = models.CharField(
        max_length=20,
        choices=FitnessGoal.choices,
        blank=True
    )

    joining_date = models.DateField(
        auto_now_add=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.user.username