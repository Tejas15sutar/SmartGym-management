
from datetime import datetime, time

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TrainerAttendance
from .serializers import TrainerAttendanceSerializer

User = get_user_model()

GYM_CLOSING_TIME = time(22, 0)


def get_closing_datetime(attendance_date):
    """
    Return the gym closing datetime (10:00 PM)
    for the given attendance date.
    """

    return timezone.make_aware(
        datetime.combine(attendance_date, GYM_CLOSING_TIME),
        timezone.get_current_timezone(),
    )


def close_expired_attendance():
    """
    Automatically close all unfinished trainer attendance
    records whose gym closing time has passed.
    """

    now = timezone.now()
    today = timezone.localdate()

    expired_records = TrainerAttendance.objects.filter(
        check_in__isnull=False,
        check_out__isnull=True,
        date__lte=today,
    )

    for record in expired_records:
        closing_datetime = get_closing_datetime(record.date)

        if now >= closing_datetime:
            with transaction.atomic():
                locked_record = (
                    TrainerAttendance.objects
                    .select_for_update()
                    .filter(
                        pk=record.pk,
                        check_in__isnull=False,
                        check_out__isnull=True,
                    )
                    .first()
                )

                if locked_record:
                    locked_record.automatic_check_out()


class TrainerAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # Close expired attendance before returning records.
        close_expired_attendance()

        if request.user.role == "TRAINER":
            records = TrainerAttendance.objects.filter(
                trainer=request.user
            ).select_related("trainer")

        elif request.user.role in ["ADMIN", "RECEPTIONIST"]:
            records = TrainerAttendance.objects.select_related("trainer")

            trainer_id = request.query_params.get("trainer_id")

            if trainer_id:
                records = records.filter(trainer_id=trainer_id)

        else:
            return Response(
                {
                    "detail": (
                        "You do not have permission to view "
                        "trainer attendance."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TrainerAttendanceSerializer(records, many=True)

        return Response(serializer.data)


class TrainerCheckInView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != "TRAINER":
            return Response(
                {"detail": "Only trainers can check in."},
                status=status.HTTP_403_FORBIDDEN,
            )

        now = timezone.now()
        today = timezone.localdate()
        closing_datetime = get_closing_datetime(today)

        if now >= closing_datetime:
            return Response(
                {
                    "detail": (
                        "Check-in is closed for today. "
                        "The gym closes at 10:00 PM."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():

            record, created = TrainerAttendance.objects.get_or_create(
                trainer=request.user,
                date=today,
            )

            if record.check_in:
                return Response(
                    {"detail": "You have already checked in today."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if record.check_out:
                return Response(
                    {
                        "detail": (
                            "You have already completed "
                            "attendance for today."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            record.check_in = now
            record.save(update_fields=["check_in"])

        return Response(
            TrainerAttendanceSerializer(record).data,
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            ),
        )


class TrainerCheckOutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != "TRAINER":
            return Response(
                {"detail": "Only trainers can check out."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Close expired records before processing manual checkout.
        close_expired_attendance()

        today = timezone.localdate()

        try:
            record = TrainerAttendance.objects.get(
                trainer=request.user,
                date=today,
            )

        except TrainerAttendance.DoesNotExist:
            return Response(
                {"detail": "Please check in before checking out."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not record.check_in:
            return Response(
                {"detail": "Please check in before checking out."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if record.check_out:
            message = (
                "Your attendance was automatically checked out at 10:00 PM."
                if record.auto_checked_out
                else "You have already checked out today."
            )

            return Response(
                {"detail": message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        closing_datetime = get_closing_datetime(record.date)

        if now >= closing_datetime:
            close_expired_attendance()
            record.refresh_from_db()

            return Response(
                TrainerAttendanceSerializer(record).data,
                status=status.HTTP_200_OK,
            )

        record.check_out = now
        record.auto_checked_out = False

        record.save(
            update_fields=["check_out", "auto_checked_out"]
        )

        return Response(TrainerAttendanceSerializer(record).data)
