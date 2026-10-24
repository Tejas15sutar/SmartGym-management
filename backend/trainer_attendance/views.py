
from django.contrib.auth import get_user_model
from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TrainerAttendance
from .serializers import TrainerAttendanceSerializer

User = get_user_model()


class TrainerAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
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
                {"detail": "You do not have permission to view trainer attendance."},
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

        today = timezone.localdate()

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
                {"detail": "You have already completed attendance for today."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        record.check_in = timezone.now()
        record.save(update_fields=["check_in"])

        return Response(
            TrainerAttendanceSerializer(record).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class TrainerCheckOutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "TRAINER":
            return Response(
                {"detail": "Only trainers can check out."},
                status=status.HTTP_403_FORBIDDEN,
            )

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
            return Response(
                {"detail": "You have already checked out today."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        record.check_out = timezone.now()
        record.save(update_fields=["check_out"])

        return Response(TrainerAttendanceSerializer(record).data)
