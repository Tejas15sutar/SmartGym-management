from rest_framework import serializers
from .models import (
    WorkoutPlan,
    Exercise,
    WorkoutPlanExercise,
    MemberWorkout,
    WorkoutLog,
)


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = "__all__"
        read_only_fields = ["id", "created_at"]


class WorkoutPlanExerciseSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(
        source="exercise.name",
        read_only=True
    )
    exercise_category = serializers.CharField(
        source="exercise.category",
        read_only=True
    )

    class Meta:
        model = WorkoutPlanExercise
        fields = "__all__"


class WorkoutPlanSerializer(serializers.ModelSerializer):
    plan_exercises = WorkoutPlanExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutPlan
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "created_by"]


class MemberWorkoutSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(
        source="member.username",
        read_only=True
    )
    workout_plan_name = serializers.CharField(
        source="workout_plan.name",
        read_only=True
    )
    workout_plan_details = WorkoutPlanSerializer(
        source="workout_plan",
        read_only=True
    )

    class Meta:
        model = MemberWorkout
        fields = "__all__"
        read_only_fields = [
            "id",
            "assigned_by",
            "created_at",
            "workout_plan_details",
        ]


class WorkoutLogSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(
        source="plan_exercise.exercise.name",
        read_only=True
    )

    class Meta:
        model = WorkoutLog
        fields = "__all__"
        read_only_fields = ["id", "created_at"]