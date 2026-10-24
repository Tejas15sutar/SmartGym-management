
from django.contrib import admin
from .models import MembershipPlan, Membership


@admin.register(MembershipPlan)
class MembershipPlanAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "plan_type",
        "duration_days",
        "price",
        "is_active",
    )

    list_filter = ("plan_type", "is_active")

    search_fields = ("name",)


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):

    list_display = (
        "member",
        "plan",
        "start_date",
        "end_date",
        "amount_paid",
        "status",
    )

    list_filter = ("status", "start_date")

    search_fields = (
        "member__username",
        "plan__name",
    )

    readonly_fields = ("created_at", "updated_at")
