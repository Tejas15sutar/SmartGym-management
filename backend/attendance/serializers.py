from rest_framework import serializers

from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(
        source="member.username",
        read_only=True
    )

    class Meta:
        model = Attendance
        fields = "__all__"

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "member_name",
        ]