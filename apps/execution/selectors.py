from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Iterable

from django.db.models import Exists, OuterRef, QuerySet

from apps.execution.models import (
    ExecutionRecord,
    ExecutionRecordVersion,
    PileDrivingRecord,
)
from apps.projects.models import Project, ProjectMembership
from apps.piles.models import Pile

if TYPE_CHECKING:
    from django.contrib.auth.models import AbstractBaseUser


@dataclass(frozen=True)
class ExecutionVisibilityContext:
    """Resolved execution visibility context for a user."""

    can_see_all_projects: bool


def _get_visibility_context(user: AbstractBaseUser) -> ExecutionVisibilityContext:
    if not user or not getattr(user, "is_authenticated", False):
        return ExecutionVisibilityContext(can_see_all_projects=False)

    if user.is_superuser:
        return ExecutionVisibilityContext(can_see_all_projects=True)

    user_groups = set(user.groups.values_list("name", flat=True))
    return ExecutionVisibilityContext(can_see_all_projects=("admin" in user_groups))


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


def visible_execution_records_queryset(
    user: AbstractBaseUser,
) -> QuerySet[ExecutionRecord]:
    """ExecutionRecord queryset visible to the user via project membership."""

    ctx = _get_visibility_context(user)

    queryset = ExecutionRecord.objects.select_related(
        "project",
        "pile",
    )

    if ctx.can_see_all_projects:
        return queryset

    return queryset.filter(project__memberships__user=user).distinct()


def visible_execution_record_versions_queryset(
    user: AbstractBaseUser,
) -> QuerySet[ExecutionRecordVersion]:
    """ExecutionRecordVersion queryset visible to the user via project membership."""

    ctx = _get_visibility_context(user)

    queryset = ExecutionRecordVersion.objects.select_related(
        "execution_record",
        "execution_record__project",
        "submitted_by",
    )

    if ctx.can_see_all_projects:
        return queryset

    return queryset.filter(execution_record__project__memberships__user=user).distinct()


def visible_pile_driving_records_queryset(
    user: AbstractBaseUser,
) -> QuerySet[PileDrivingRecord]:
    """PileDrivingRecord queryset visible to the user via project membership."""

    ctx = _get_visibility_context(user)

    queryset = PileDrivingRecord.objects.select_related(
        "project",
        "pile",
        "execution_record",
        "execution_record__latest_version",
    )

    if ctx.can_see_all_projects:
        return queryset

    return queryset.filter(project__memberships__user=user).distinct()


def visible_piles_queryset(user: AbstractBaseUser) -> QuerySet[Pile]:
    """Piles visible to the user via project membership."""

    ctx = _get_visibility_context(user)

    queryset = Pile.objects.select_related("project")

    if ctx.can_see_all_projects:
        return queryset

    return queryset.filter(project__memberships__user=user).distinct()


def visible_projects_for_membership_roles(
    user: AbstractBaseUser,
    roles: Iterable[str],
) -> QuerySet[Project]:
    """Projects visible to the user filtered by ProjectMembership.role."""

    ctx = _get_visibility_context(user)

    if ctx.can_see_all_projects:
        return Project.objects.all()

    roles_set = set(roles)
    return Project.objects.filter(
        memberships__user=user,
        memberships__role__in=roles_set,
    ).distinct()
