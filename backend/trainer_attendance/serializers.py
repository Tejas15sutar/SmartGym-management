
from rest_framework import serializers
from .models import TrainerAttendance


class TrainerAttendanceSerializer(serializers.ModelSerializer):
    trainer_username = serializers.CharField(
        source="trainer.username",
        read_only=True
    )
    trainer_name = serializers.SerializerMethodField()
    duration_seconds = serializers.ReadOnlyField()

    class Meta:
        model = TrainerAttendance
        fields = [
            "id",
            "trainer",
            "trainer_username",
            "trainer_name",
            "date",
            "check_in",
            "check_out",
            "duration_seconds",
            "created_at",
        ]
        read_only_fields = fields

    def get_trainer_name(self, obj):
        full_name = obj.trainer.get_full_name()
        return full_name if full_name else obj.trainer.username
