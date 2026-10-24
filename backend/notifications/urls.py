
from django.urls import path

from .views import (
    HolidayAnnouncementView,
    NotificationListView,
    ProcessNotificationView,
)

urlpatterns = [
    path(
        "",
        NotificationListView.as_view(),
        name="notification-list",
    ),
    path(
        "announcements/",
        HolidayAnnouncementView.as_view(),
        name="holiday-announcement",
    ),
    path(
        "<int:notification_id>/process/",
        ProcessNotificationView.as_view(),
        name="notification-process",
    ),
]
