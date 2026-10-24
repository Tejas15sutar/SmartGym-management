
from django.urls import path

from .views import (
    TrainerAttendanceView,
    TrainerCheckInView,
    TrainerCheckOutView,
)

urlpatterns = [
    path("", TrainerAttendanceView.as_view(), name="trainer-attendance"),
    path("check-in/", TrainerCheckInView.as_view(), name="trainer-check-in"),
    path("check-out/", TrainerCheckOutView.as_view(), name="trainer-check-out"),
]
