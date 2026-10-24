from rest_framework.routers import DefaultRouter

from .views import (
    WorkoutPlanViewSet,
    ExerciseViewSet,
    WorkoutPlanExerciseViewSet,
    MemberWorkoutViewSet,
    WorkoutLogViewSet,
)

router = DefaultRouter()

router.register("plans", WorkoutPlanViewSet, basename="workout-plan")
router.register("exercises", ExerciseViewSet, basename="exercise")
router.register("plan-exercises", WorkoutPlanExerciseViewSet, basename="plan-exercise")
router.register("assignments", MemberWorkoutViewSet, basename="member-workout")
router.register("logs", WorkoutLogViewSet, basename="workout-log")

urlpatterns = router.urls