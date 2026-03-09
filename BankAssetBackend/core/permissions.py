from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import User

# Role rank for comparison (User model has ROLE_CHOICES, not Role enum)
ROLE_RANK = {
    "THIRD_PARTY_OPERATOR": 0,
    "BANK_EMPLOYEE": 1,
    "LOCATION_ADMIN": 2,
    "SUPER_ADMIN": 3,
}


def _get_role_rank(user) -> int:
    if not user or not hasattr(user, "role"):
        return 0
    return ROLE_RANK.get(user.role, 0)


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "SUPER_ADMIN"
        )


class IsLocationAdminOrAbove(BasePermission):
    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        return _get_role_rank(request.user) >= ROLE_RANK["LOCATION_ADMIN"]


class IsBankEmployeeOrAbove(BasePermission):
    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        return _get_role_rank(request.user) >= ROLE_RANK["BANK_EMPLOYEE"]


class ReadOnlyForLowerRoles(BasePermission):
    """
    Allow read-only access to all authenticated users but restrict
    modifying operations to Bank Employee and above.
    """

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return _get_role_rank(request.user) >= ROLE_RANK["BANK_EMPLOYEE"]


class RoleBasedAccessPermission(BasePermission):
    """
    RBAC implementation that maps Django user roles to the logical
    roles required by the product:

    - Admin   -> SUPER_ADMIN
    - Manager -> LOCATION_ADMIN
    - Employee -> BANK_EMPLOYEE
    - Viewer -> THIRD_PARTY_OPERATOR

    Permissions:
      - Viewer:  read-only
      - Employee: read + create
      - Manager:  read + create + update
      - Admin:    full CRUD (including delete)
    """

    # Minimum role rank required per HTTP method
    METHOD_MIN_ROLE = {
        # Viewer and above
        "GET": "THIRD_PARTY_OPERATOR",
        "HEAD": "THIRD_PARTY_OPERATOR",
        "OPTIONS": "THIRD_PARTY_OPERATOR",
        # Employee and above
        "POST": "BANK_EMPLOYEE",
        # Manager and above
        "PUT": "LOCATION_ADMIN",
        "PATCH": "LOCATION_ADMIN",
        # Admin only
        "DELETE": "SUPER_ADMIN",
    }

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False

        min_role = self.METHOD_MIN_ROLE.get(request.method, "SUPER_ADMIN")
        required_rank = ROLE_RANK[min_role]
        return _get_role_rank(user) >= required_rank

