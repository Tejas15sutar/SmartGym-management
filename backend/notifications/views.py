
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .permissions import IsGymAdmin
from .serializers import (
    HolidayAnnouncementSerializer,
    NotificationSerializer,
)
from .services import process_notification


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, IsGymAdmin]

    def get_queryset(self):
        queryset = Notification.objects.select_related(
            "recipient",
            "payment",
        )

        notification_type = self.request.query_params.get(
            "notification_type"
        )
        notification_status = self.request.query_params.get("status")

        if notification_type:
            queryset = queryset.filter(
                notification_type=notification_type
            )

        if notification_status:
            queryset = queryset.filter(status=notification_status)

        return queryset


class HolidayAnnouncementView(APIView):
    permission_classes = [IsAuthenticated, IsGymAdmin]

    def post(self, request):
        serializer = HolidayAnnouncementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        title = serializer.validated_data["title"].strip()
        message = serializer.validated_data["message"].strip()

        if not title or not message:
            return Response(
                {
                    "detail": (
                        "Announcement title and message "
                        "cannot be empty."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.contrib.auth import get_user_model

        User = get_user_model()

        recipients = User.objects.exclude(
            phone__isnull=True
        ).exclude(phone="")

        notifications = [
            Notification(
                recipient=user,
                notification_type="HOLIDAY_ANNOUNCEMENT",
                channel="WHATSAPP",
                recipient_phone=user.phone,
                message=f"{title}\n\n{message}",
                status="PENDING",
            )
            for user in recipients.iterator()
        ]

        created = Notification.objects.bulk_create(notifications)

        return Response(
            {
                "detail": (
                    "Announcement queued. WhatsApp delivery "
                    "is not enabled yet."
                ),
                "queued_count": len(created),
            },
            status=status.HTTP_201_CREATED,
        )


class ProcessNotificationView(APIView):
    permission_classes = [IsAuthenticated, IsGymAdmin]

    def post(self, request, notification_id):
        result = process_notification(notification_id)

        if result.get("detail") == "Notification not found.":
            return Response(
                result,
                status=status.HTTP_404_NOT_FOUND,
            )

        if not result.get("success"):
            return Response(
                result,
                status=status.HTTP_409_CONFLICT,
            )

        return Response(result, status=status.HTTP_200_OK)
