from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from .models import (
    WorkoutPlan,
    Exercise,
    WorkoutPlanExercise,
    MemberWorkout,
    WorkoutLog,
)

from .serializers import (
    WorkoutPlanSerializer,
    ExerciseSerializer,
    WorkoutPlanExerciseSerializer,
    MemberWorkoutSerializer,
    WorkoutLogSerializer,
)

from .permissions import IsAdminOrTrainer, IsWorkoutStaffOrReadOnly, IsWorkoutLogAccess


class WorkoutPlanViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutPlanSerializer
    permission_classes = [IsAuthenticated, IsWorkoutStaffOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return WorkoutPlan.objects.all().prefetch_related(
                "plan_exercises__exercise"
            )

        return WorkoutPlan.objects.filter(
            is_active=True
        ).prefetch_related("plan_exercises__exercise")

    def perform_create(self, serializer):
        if self.request.user.role not in ["ADMIN", "TRAINER"]:
            raise ValidationError("Only Admin and Trainer can create workout plans.")

        serializer.save(created_by=self.request.user)


class ExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTrainer]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Exercise.objects.all().order_by("name")

        return Exercise.objects.filter(is_active=True).order_by("name")


class WorkoutPlanExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutPlanExerciseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTrainer]

    def get_queryset(self):
        return WorkoutPlanExercise.objects.select_related(
            "workout_plan", "exercise"
        )


class MemberWorkoutViewSet(viewsets.ModelViewSet):
    serializer_class = MemberWorkoutSerializer
    permission_classes = [IsAuthenticated, IsWorkoutStaffOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        queryset = MemberWorkout.objects.select_related(
            "member", "workout_plan"
        )

        if user.role == "ADMIN":
            return queryset.all().order_by("-created_at")

        if user.role == "TRAINER":
            return queryset.filter(
                assigned_by=user
            ).order_by("-created_at")

        if user.role == "MEMBER":
            return queryset.filter(
                member=user
            ).order_by("-created_at")

        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        member = serializer.validated_data["member"]
        workout_plan = serializer.validated_data["workout_plan"]
        start_date = serializer.validated_data["start_date"]
        end_date = serializer.validated_data["end_date"]

        if user.role not in ["ADMIN", "TRAINER"]:
            raise ValidationError("Only Admin and Trainer can assign workouts.")

        if member.role != "MEMBER":
            raise ValidationError("Workouts can only be assigned to members.")

        if not workout_plan.is_active:
            raise ValidationError("This workout plan is inactive.")

        if end_date < start_date:
            raise ValidationError("End date cannot be earlier than start date.")

        serializer.save(assigned_by=user)


class WorkoutLogViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutLogSerializer
    permission_classes = [IsAuthenticated, IsWorkoutLogAccess]

    def get_queryset(self):
        user = self.request.user

        queryset = WorkoutLog.objects.select_related(
            "member_workout__member",
            "plan_exercise__exercise",
            "member_workout__workout_plan",
        )

        if user.role == "ADMIN":
            return queryset.all()

        if user.role == "TRAINER":
            return queryset.filter(
                member_workout__assigned_by=user
            )

        if user.role == "MEMBER":
            return queryset.filter(
                member_workout__member=user
            )

        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        member_workout = serializer.validated_data["member_workout"]
        plan_exercise = serializer.validated_data["plan_exercise"]
        workout_date = serializer.validated_data["workout_date"]

        if user.role != "MEMBER":
            raise ValidationError("Only members can submit their workout logs.")

        if member_workout.member_id != user.id:
            raise ValidationError("You cannot log another member's workout.")

        if member_workout.status != "ACTIVE":
            raise ValidationError("This workout assignment is not active.")

        if not (member_workout.start_date <= workout_date <= member_workout.end_date):
            raise ValidationError("Workout date is outside the assigned workout period.")

        if plan_exercise.workout_plan_id != member_workout.workout_plan_id:
            raise ValidationError("This exercise does not belong to your assigned plan.")

        serializer.save()