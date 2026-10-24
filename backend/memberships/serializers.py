
from rest_framework import serializers
from .models import MembershipPlan, Membership


class MembershipPlanSerializer(serializers.ModelSerializer):

    class Meta:
        model = MembershipPlan
        fields = "__all__"
        read_only_fields = ("id", "created_at")


class MembershipSerializer(serializers.ModelSerializer):

    member_name = serializers.CharField(
        source="member.username",
        read_only=True
    )

    plan_name = serializers.CharField(
        source="plan.name",
        read_only=True
    )

    remaining_days = serializers.IntegerField(read_only=True)

    class Meta:
        model = Membership
        fields = [
            "id",
            "member",
            "member_name",
            "plan",
            "plan_name",
            "start_date",
            "end_date",
            "amount_paid",
            "status",
            "remaining_days",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
    "id",
    "end_date",
    "amount_paid",
    "status",
    "remaining_days",
    "created_at",
    "updated_at",
]
