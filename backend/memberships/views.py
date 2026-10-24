
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import MembershipPlan, Membership
from .serializers import (
    MembershipPlanSerializer,
    MembershipSerializer,
)
from .permissions import (
    IsAdminRoleOrReadOnly,
    IsMembershipStaffOrReadOnly,
)


class MembershipPlanViewSet(viewsets.ModelViewSet):
    serializer_class = MembershipPlanSerializer
    permission_classes = [
        IsAuthenticated,
        IsAdminRoleOrReadOnly,
    ]

    def get_queryset(self):
        queryset = MembershipPlan.objects.all().order_by("price")

        if self.request.user.role == "ADMIN":
            return queryset

        return queryset.filter(is_active=True)


class MembershipViewSet(viewsets.ModelViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [
        IsAuthenticated,
        IsMembershipStaffOrReadOnly,
    ]

    def get_queryset(self):
        user = self.request.user
        today = timezone.localdate()

        # Expire memberships only after their end date.
        Membership.objects.filter(
            status="ACTIVE",
            end_date__lt=today,
        ).update(status="EXPIRED")

        queryset = Membership.objects.select_related(
            "member",
            "plan",
        )

        if user.role in ["ADMIN", "RECEPTIONIST"]:
            return queryset.order_by("-created_at")

        if user.role == "MEMBER":
            return queryset.filter(
                member=user,
            ).order_by("-created_at")

        return queryset.none()

    def perform_create(self, serializer):
        member = serializer.validated_data["member"]
        plan = serializer.validated_data["plan"]
        start_date = serializer.validated_data["start_date"]

        if member.role != "MEMBER":
            raise ValidationError({
                "member": "Membership can only be assigned to a member."
            })

        if not plan.is_active:
            raise ValidationError({
                "plan": "This membership plan is not active."
            })

        if plan.duration_days < 1:
            raise ValidationError({
                "plan": "Membership plan duration must be at least one day."
            })

        end_date = start_date + timedelta(
            days=plan.duration_days - 1
        )

        today = timezone.localdate()

        if end_date < today:
            raise ValidationError({
                "start_date": "The membership end date cannot be in the past."
            })

        # Prevent overlapping active or upcoming memberships.
        overlapping = Membership.objects.filter(
            member=member,
            status__in=["PENDING", "ACTIVE"],
            start_date__lte=end_date,
            end_date__gte=start_date,
        ).exists()

        if overlapping:
            raise ValidationError({
                "member": (
                    "This member already has an active or upcoming "
                    "membership during these dates."
                )
            })

        # Assignment is not payment. Keep it pending until payment
        # confirmation activates it through the payment workflow.
        serializer.save(
            end_date=end_date,
            status="PENDING",
            amount_paid=0,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="renew",
    )
    @transaction.atomic
    def renew(self, request, pk=None):
        old_membership = self.get_object()
        today = timezone.localdate()

        plan_id = request.data.get("plan")

        if not plan_id:
            return Response(
                {"plan": "Please provide a membership plan ID."},
                status=400,
            )

        try:
            new_plan = MembershipPlan.objects.get(
                id=plan_id,
                is_active=True,
            )
        except (MembershipPlan.DoesNotExist, ValueError, TypeError):
            return Response(
                {"plan": "Invalid or inactive membership plan."},
                status=400,
            )

        if new_plan.duration_days < 1:
            return Response(
                {"plan": "Membership plan duration must be at least one day."},
                status=400,
            )

        latest_membership = Membership.objects.filter(
            member=old_membership.member,
            status__in=["ACTIVE", "PENDING"],
            end_date__gte=today,
        ).order_by("-end_date", "-start_date").first()

        start_date = (
            latest_membership.end_date + timedelta(days=1)
            if latest_membership
            else today
        )

        end_date = start_date + timedelta(
            days=new_plan.duration_days - 1
        )

        overlapping = Membership.objects.filter(
            member=old_membership.member,
            status__in=["PENDING", "ACTIVE"],
            start_date__lte=end_date,
            end_date__gte=start_date,
        ).exists()

        if overlapping:
            return Response(
                {
                    "detail": (
                        "Another active or upcoming membership "
                        "already covers these dates."
                    )
                },
                status=400,
            )

        # A renewal also requires its own payment confirmation.
        new_membership = Membership.objects.create(
            member=old_membership.member,
            plan=new_plan,
            start_date=start_date,
            end_date=end_date,
            amount_paid=0,
            status="PENDING",
        )

        return Response(
            self.get_serializer(new_membership).data,
            status=201,
        )
