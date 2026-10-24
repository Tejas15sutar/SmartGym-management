from rest_framework import serializers

from .models import Member


class MemberSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    email = serializers.EmailField(
        source="user.email",
        read_only=True
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True
    )

    phone = serializers.CharField(
        source="user.phone",
        read_only=True
    )

    class Meta:
        model = Member

        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "date_of_birth",
            "gender",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "height",
            "weight",
            "fitness_goal",
            "joining_date",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "joining_date",
            "created_at",
            "updated_at",
        ]