from django.db import models
from django.conf import settings


class WorkoutPlan(models.Model):
    LEVEL_CHOICES = [
        ("BEGINNER", "Beginner"),
        ("INTERMEDIATE", "Intermediate"),
        ("ADVANCED", "Advanced"),
    ]

    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default="BEGINNER"
    )
    duration_weeks = models.PositiveIntegerField(default=4)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_workout_plans"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Exercise(models.Model):
    CATEGORY_CHOICES = [
        ("CHEST", "Chest"),
        ("BACK", "Back"),
        ("SHOULDERS", "Shoulders"),
        ("ARMS", "Arms"),
        ("LEGS", "Legs"),
        ("ABS", "Abs"),
        ("CARDIO", "Cardio"),
        ("FULL_BODY", "Full Body"),
    ]

    name = models.CharField(max_length=150)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    instructions = models.TextField(blank=True)
    video_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class WorkoutPlanExercise(models.Model):
    workout_plan = models.ForeignKey(
        WorkoutPlan,
        on_delete=models.CASCADE,
        related_name="plan_exercises"
    )
    exercise = models.ForeignKey(
        Exercise,
        on_delete=models.PROTECT,
        related_name="plan_assignments"
    )
    day_number = models.PositiveIntegerField(default=1)
    sets = models.PositiveIntegerField(default=3)
    reps = models.CharField(max_length=50, default="12")
    rest_seconds = models.PositiveIntegerField(default=60)
    notes = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["day_number", "order"]
        unique_together = ("workout_plan", "exercise", "day_number")

    def __str__(self):
        return f"{self.workout_plan.name} - {self.exercise.name}"


class MemberWorkout(models.Model):
    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assigned_workouts"
    )
    workout_plan = models.ForeignKey(
        WorkoutPlan,
        on_delete=models.PROTECT,
        related_name="member_assignments"
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="assigned_member_workouts"
    )
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="ACTIVE"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.member.username} - {self.workout_plan.name}"


class WorkoutLog(models.Model):
    member_workout = models.ForeignKey(
        MemberWorkout,
        on_delete=models.CASCADE,
        related_name="workout_logs"
    )
    plan_exercise = models.ForeignKey(
        WorkoutPlanExercise,
        on_delete=models.PROTECT,
        related_name="workout_logs"
    )
    workout_date = models.DateField()
    completed_sets = models.PositiveIntegerField(default=0)
    completed_reps = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("member_workout", "plan_exercise", "workout_date")
        ordering = ["-workout_date"]

    def __str__(self):
        return f"{self.member_workout.member.username} - {self.workout_date}"