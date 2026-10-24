from django.contrib import admin
from .models import (
    WorkoutPlan,
    Exercise,
    WorkoutPlanExercise,
    MemberWorkout,
    WorkoutLog,
)


@admin.register(WorkoutPlan)
class WorkoutPlanAdmin(admin.ModelAdmin):
    list_display = ("name", "level", "duration_weeks", "is_active")
    list_filter = ("level", "is_active")
    search_fields = ("name",)


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name",)


@admin.register(WorkoutPlanExercise)
class WorkoutPlanExerciseAdmin(admin.ModelAdmin):
    list_display = (
        "workout_plan",
        "exercise",
        "day_number",
        "sets",
        "reps",
        "rest_seconds",
    )
    list_filter = ("day_number", "workout_plan")


@admin.register(MemberWorkout)
class MemberWorkoutAdmin(admin.ModelAdmin):
    list_display = (
        "member",
        "workout_plan",
        "start_date",
        "end_date",
        "status",
    )
    list_filter = ("status", "start_date")
    search_fields = ("member__username", "workout_plan__name")


@admin.register(WorkoutLog)
class WorkoutLogAdmin(admin.ModelAdmin):
    list_display = (
        "member_workout",
        "plan_exercise",
        "workout_date",
        "completed",
    )
    list_filter = ("completed", "workout_date")