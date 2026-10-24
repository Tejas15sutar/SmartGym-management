
from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):

    member_name = serializers.CharField(
        source="member.username",
        read_only=True
    )

    membership_plan = serializers.CharField(
        source="membership.plan.name",
        read_only=True
    )

    class Meta:
        model = Payment

        fields = [
            "id",
            "member",
            "member_name",
            "membership",
            "membership_plan",
            "amount",
            "payment_method",
            "payment_status",
            "transaction_id",
            "payment_date",
            "notes",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "payment_date",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        instance = getattr(self, "instance", None)

        member = attrs.get(
            "member",
            instance.member if instance else None
        )

        membership = attrs.get(
            "membership",
            instance.membership if instance else None
        )

        amount = attrs.get(
            "amount",
            instance.amount if instance else None
        )

        payment_status = attrs.get(
            "payment_status",
            instance.payment_status if instance else "PENDING"
        )

        if member and membership and membership.member_id != member.id:
            raise serializers.ValidationError({
                "membership": (
                    "This membership does not belong to the selected member."
                )
            })

        if amount is not None and amount <= 0:
            raise serializers.ValidationError({
                "amount": "Payment amount must be greater than zero."
            })

        if membership:
            if membership.status == "CANCELLED":
                raise serializers.ValidationError({
                    "membership": (
                        "Payment cannot be recorded for a cancelled membership."
                    )
                })

            if amount is not None and amount != membership.plan.price:
                raise serializers.ValidationError({
                    "amount": (
                        "Payment amount must match the membership plan price."
                    )
                })

        if payment_status == "SUCCESSFUL" and instance is None:
            # New payments should begin as pending.
            # The receptionist can confirm them through a separate action.
            raise serializers.ValidationError({
                "payment_status": (
                    "Create the payment as PENDING, then confirm it "
                    "after verifying receipt of payment."
                )
            })

        if (
            instance
            and instance.payment_status == "SUCCESSFUL"
        ):
            raise serializers.ValidationError({
                "payment_status": (
                    "Successful payments cannot be modified."
                )
            })

        return attrs
