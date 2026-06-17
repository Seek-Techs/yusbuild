from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Iterable, Optional

from django.db.models import Exists, OuterRef, QuerySet

from apps.piles.models import Pile, PileCalculationHistory
from apps.projects.models import Project, ProjectMembership

if TYPE_CHECKING:
    from django.contrib.auth.models import AbstractBaseUser


@dataclass(frozen=True)
class PileVisibilityContext:
    """Resolved visibility context for a user.

    This context is intentionally minimal and focused on query scoping.
    Method-level permission enforcement (read vs write) is handled by
    DRF permission classes.
    """

    can_see_all_projects: bool


def _get_visibility_context(user: AbstractBaseUser) -> PileVisibilityContext:
    if not user or not getattr(user, "is_authenticated", False):
        return PileVisibilityContext(can_see_all_projects=False)

    if user.is_superuser:
        return PileVisibilityContext(can_see_all_projects=True)

    user_groups = set(user.groups.values_list("name", flat=True))
    return PileVisibilityContext(can_see_all_projects=("admin" in user_groups))


def visible_projects_queryset(user: AbstractBaseUser) -> QuerySet[Project]:
    """Projects visible to the given user."""

    ctx = _get_visibility_context(user)
    qs = Project.objects.all()

    if ctx.can_see_all_projects:
        return qs

    membership_qs = ProjectMembership.objects.filter(
        project_id=OuterRef("pk"),
        user=user,
    )

    return qs.annotate(_has_membership=Exists(membership_qs)).filter(
        _has_membership=True
    )


def visible_piles_queryset(user: AbstractBaseUser) -> QuerySet[Pile]:
    """Piles visible to the authenticated user via project membership."""

    ctx = _get_visibility_context(user)

    queryset = (
        Pile.objects.select_related("project", "calculation")
        if hasattr(Pile, "_meta")
        else Pile.objects.all()
    )

    if ctx.can_see_all_projects:
        return queryset

    return queryset.filter(project__memberships__user=user).distinct()


def visible_pile_ids(user: AbstractBaseUser) -> QuerySet:
    """Convenience selector returning IDs for visible piles."""

    return visible_piles_queryset(user).values_list("id", flat=True)


def visible_piles_by_project_roles(
    user: AbstractBaseUser,
    roles: Iterable[str],
) -> QuerySet[Pile]:
    """Visible piles restricted to projects where membership.role in roles."""

    ctx = _get_visibility_context(user)

    if ctx.can_see_all_projects:
        return Pile.objects.all()

    roles_set = set(roles)

    return Pile.objects.filter(
        project__memberships__user=user, project__memberships__role__in=roles_set
    ).distinct()


def visible_pile_history_queryset(
    user: AbstractBaseUser,
) -> QuerySet[PileCalculationHistory]:
    """Calculation history entries for visible piles."""

    ctx = _get_visibility_context(user)

    queryset = PileCalculationHistory.objects.select_related(
        "pile",
        "triggered_by",
        "calculation",
    )

    if ctx.can_see_all_projects:
        return queryset

    return queryset.filter(pile__project__memberships__user=user).distinct()


def get_user_pile_membership_role(
    user: AbstractBaseUser,
    pile: Pile,
) -> Optional[str]:
    """Return the membership role for the given user's assignment on the pile's project."""

    if not user or not getattr(user, "is_authenticated", False):
        return None

    if user.is_superuser:
        return ProjectMembership.ROLE_ADMIN

    if not pile:
        return None

    membership = (
        ProjectMembership.objects.filter(project=pile.project, user=user)
        .only("role")
        .first()
    )
    if membership is None:
        return None
    return membership.role
