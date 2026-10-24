
from django.contrib import admin
from .models import Enquiry


@admin.register(Enquiry)
class EnquiryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "phone",
        "interested_plan",
        "status",
        "follow_up_date",
        "created_at",
    )
    list_filter = ("status", "follow_up_date")
    search_fields = ("name", "phone", "email")
