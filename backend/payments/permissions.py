
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsPaymentStaffOrReadOnly(BasePermission):
    """
    Admin and Receptionist can manage payments.
    Members can only view their own payments.
    Trainers cannot access payments.
    """

    def has_permission(self, request, view):

        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role in ["ADMIN", "RECEPTIONIST"]:
            return True

        if request.user.role == "MEMBER":
            return request.method in SAFE_METHODS

        return False
