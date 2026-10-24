from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Attendance
from .serializers import AttendanceSerializer


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Attendance.objects.select_related(
                "member"
            ).all()

        if user.role == "RECEPTIONIST":
            return Attendance.objects.select_related(
                "member"
            ).all()

        if user.role == "TRAINER":
            return Attendance.objects.select_related(
                "member"
            ).all()

        if user.role == "MEMBER":
            return Attendance.objects.select_related(
                "member"
            ).filter(member=user)

        return Attendance.objects.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user.role not in ["ADMIN", "RECEPTIONIST"]:
            raise ValidationError(
                "Only Admin and Receptionist can record attendance."
            )

        member = serializer.validated_data["member"]

        if member.role != "MEMBER":
            raise ValidationError(
                "Attendance can only be recorded for members."
            )

        serializer.save()

    @action(
        detail=True,
        methods=["post"],
        url_path="check-out"
    )
    def check_out(self, request, pk=None):
        attendance = self.get_object()

        if request.user.role not in ["ADMIN", "RECEPTIONIST"]:
            return Response(
                {
                    "detail": (
                        "Only Admin and Receptionist can "
                        "check out members."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if attendance.check_out:
            return Response(
                {
                    "detail": "Member has already checked out."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        attendance.check_out = timezone.now()

        attendance.save(
            update_fields=["check_out", "updated_at"]
        )

        return Response(
            AttendanceSerializer(attendance).data,
            status=status.HTTP_200_OK
        )