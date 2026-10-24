
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminRoleOrReadOnly(BasePermission):
    """
    Admin can manage membership plans.
    Authenticated users can only view plans.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated

        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsMembershipStaffOrReadOnly(BasePermission):
    """
    Admin and Receptionist can manage memberships.
    Members can only view their own memberships.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated

        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["ADMIN", "RECEPTIONIST"]
        )
