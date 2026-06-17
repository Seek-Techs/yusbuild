from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Optional

from typing import TYPE_CHECKING

from django.db.models import Exists, OuterRef, QuerySet

if TYPE_CHECKING:
    from django.contrib.auth.models import AbstractBaseUser


from apps.projects.models import Project, ProjectMembership


@dataclass(frozen=True)
class ProjectVisibilityContext:
    """Resolved visibility context for a user.

    - superuser: can see all projects
    - admin group: can see all projects
    - otherwise: visibility is limited to projects with a membership record for the user

    Note: This context focuses on *query scoping*. Method-level enforcement (read vs write)
    is handled by existing permission classes.
    """

    is_superuser: bool
    can_see_all_projects: bool


def _get_visibility_context(user: AbstractBaseUser) -> ProjectVisibilityContext:
    if not user or not getattr(user, "is_authenticated", False):
        return ProjectVisibilityContext(
            is_superuser=False,
            can_see_all_projects=False,
        )

    if user.is_superuser:
        return ProjectVisibilityContext(is_superuser=True, can_see_all_projects=True)

    user_groups = set(user.groups.values_list("name", flat=True))
    can_see_all = "admin" in user_groups

    return ProjectVisibilityContext(
        is_superuser=False,
        can_see_all_projects=can_see_all,
    )


def visible_projects_queryset(user: AbstractBaseUser) -> QuerySet[Project]:
    """Projects visible to the given user.

    Rules:
    - superuser/admin group: all projects
    - otherwise: projects where the user has a membership
    """

    ctx = _get_visibility_context(user)
    qs = Project.objects.all()

    if ctx.can_see_all_projects:
        return qs

    # Limit by membership existence for this user.
    membership_qs = ProjectMembership.objects.filter(
        project_id=OuterRef("pk"),
        user=user,
    )

    return qs.annotate(_has_membership=Exists(membership_qs)).filter(
        _has_membership=True
    )


def visible_project_ids(user: AbstractBaseUser) -> QuerySet:
    """Convenience selector returning IDs for visible projects."""

    return visible_projects_queryset(user).values_list("id", flat=True)


def visible_projects_for_user_and_membership_role(
    user: AbstractBaseUser,
    roles: Iterable[str],
) -> QuerySet[Project]:
    """Projects visible to the user restricted to specific membership roles.

    This is primarily useful for endpoints that need to differentiate role-based
    behavior beyond method-level permissions.

    Rules:
    - superuser/admin group: all projects regardless of roles
    - otherwise: only projects with membership role in `roles`
    """

    ctx = _get_visibility_context(user)
    roles_set = set(roles)

    if ctx.can_see_all_projects:
        return Project.objects.all()

    return Project.objects.filter(
        memberships__user=user, memberships__role__in=roles_set
    ).distinct()


def visible_project_memberships_queryset(
    user: AbstractBaseUser,
) -> QuerySet[ProjectMembership]:
    """Membership rows for projects visible to the given user.

    - superuser/admin group: all memberships
    - otherwise: memberships for this user only
    """

    ctx = _get_visibility_context(user)

    if ctx.can_see_all_projects:
        return ProjectMembership.objects.select_related("project", "user")

    return ProjectMembership.objects.filter(user=user).select_related("project", "user")


def get_user_project_membership(
    user: AbstractBaseUser,
    project: Project,
) -> Optional[ProjectMembership]:
    """Return the membership for the user on the given project, if any."""

    if not project or not user or not getattr(user, "is_authenticated", False):
        return None

    return ProjectMembership.objects.filter(project=project, user=user).first()
