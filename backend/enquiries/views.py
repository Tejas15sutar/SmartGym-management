
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Enquiry
from .serializers import EnquirySerializer


class EnquiryRolePermission(IsAuthenticated):
    """
    Only Admin and Receptionist can manage enquiries.
    """

    def has_permission(self, request, view):
        allowed = super().has_permission(request, view)

        return (
            allowed
            and request.user.role in ["ADMIN", "RECEPTIONIST"]
        )


class EnquiryListCreateView(generics.ListCreateAPIView):
    serializer_class = EnquirySerializer
    permission_classes = [EnquiryRolePermission]

    def get_queryset(self):
        queryset = Enquiry.objects.all()

        status = self.request.query_params.get("status")
        search = self.request.query_params.get("search")

        if status:
            queryset = queryset.filter(status=status)

        if search:
            from django.db.models import Q

            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(phone__icontains=search)
                | Q(email__icontains=search)
            )

        return queryset


class EnquiryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer
    permission_classes = [EnquiryRolePermission]
