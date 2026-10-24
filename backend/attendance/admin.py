from django.contrib import admin
from .models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = (
        "member",
        "date",
        "check_in",
        "check_out",
        "status",
    )

    list_filter = (
        "status",
        "date",
    )

    search_fields = (
        "member__username",
        "member__email",
    )

    ordering = (
        "-date",
        "-check_in",
    )