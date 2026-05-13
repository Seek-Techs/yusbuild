from rest_framework.permissions import SAFE_METHODS, BasePermission


def get_user_group_names(user):
    """Return the user's Django group names as a set."""
    return set(user.groups.values_list("name", flat=True))


class IsAdminEngineerOrReadOnly(BasePermission):
    """
    Role-based API permission.

    - superusers: full access
    - admin group: full access
    - engineer group: full access
    - viewer group: read-only access
    """

    write_groups = {"admin", "engineer"}
    read_groups = {"admin", "engineer", "viewer"}

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        user_groups = get_user_group_names(user)

        if request.method in SAFE_METHODS:
            return bool(user_groups & self.read_groups)

        return bool(user_groups & self.write_groups)

    def has_object_permission(self, request, view, obj):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        user_groups = get_user_group_names(user)
        if "admin" in user_groups:
            return True

        project = getattr(obj, "project", obj)
        memberships = getattr(project, "memberships", None)
        if memberships is None:
            return request.method in SAFE_METHODS and bool(user_groups & self.read_groups)

        membership = memberships.filter(user=user).first()
        if membership is None:
            return False

        if request.method in SAFE_METHODS:
            return membership.role in self.read_groups and bool(user_groups & self.read_groups)

        return membership.role in self.write_groups and bool(user_groups & self.write_groups)
