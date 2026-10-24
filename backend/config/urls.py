
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/members/", include("members.urls")),
    path("api/memberships/", include("memberships.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/workouts/", include("workouts.urls")),
    path("api/attendance/", include("attendance.urls")),
    path("api/enquiries/", include("enquiries.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/trainer-attendance/", include("trainer_attendance.urls")),
]
