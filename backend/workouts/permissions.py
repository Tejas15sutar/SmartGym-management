from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrTrainer(BasePermission):
    """
    Only Admin and Trainer can manage workout plans and exercises.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ["ADMIN", "TRAINER"]
        )


class IsWorkoutStaffOrReadOnly(BasePermission):
    """
    Admin and Trainer can manage workouts.
    Members can only read workout information.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role in ["ADMIN", "TRAINER"]:
            return True

        if request.user.role == "MEMBER":
            return request.method in SAFE_METHODS

        return False
    
class IsWorkoutLogAccess(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role in ["ADMIN", "TRAINER"]:
            return True

        if request.user.role == "MEMBER":
            return request.method in SAFE_METHODS or request.method == "POST"

        return False