from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Iterable

from django.db.models import Exists, OuterRef, QuerySet

from apps.projects.models import Project, ProjectMembership
from apps.verification.models import VerificationActionLog, VarianceFlag


# Backwards compatibility: older code referenced this as VarianceActionLog
VarianceActionLog = VerificationActionLog


if TYPE_CHECKING:
    from django.contrib.auth.models import AbstractBaseUser


@dataclass(frozen=True)
class VerificationVisibilityContext:
    can_see_all_projects: bool


def _get_visibility_context(user: AbstractBaseUser) -> VerificationVisibilityContext:
    if not user or not getattr(user, "is_authenticated", False):
        return VerificationVisibilityContext(can_see_all_projects=False)

    if user.is_superuser:
        return VerificationVisibilityContext(can_see_all_projects=True)

    user_groups = set(user.groups.values_list("name", flat=True))
    return VerificationVisibilityContext(can_see_all_projects=("admin" in user_groups))


def visible_projects_queryset(user: AbstractBaseUser) -> QuerySet[Project]:
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


def visible_variance_flags_queryset(user: AbstractBaseUser) -> QuerySet[VarianceFlag]:
    ctx = _get_visibility_context(user)

    queryset = VarianceFlag.objects.select_related(
        "project",
        "pile",
        "execution_record_version",
        "resolved_by",
    ).prefetch_related("action_logs")

    if ctx.can_see_all_projects:
        return queryset

    return queryset.filter(project__memberships__user=user).distinct()


def visible_variance_flag_ids(user: AbstractBaseUser) -> QuerySet:
    return visible_variance_flags_queryset(user).values_list("id", flat=True)


def visible_variance_flags_by_project_roles(
    user: AbstractBaseUser,
    roles: Iterable[str],
) -> QuerySet[VarianceFlag]:
    ctx = _get_visibility_context(user)

    if ctx.can_see_all_projects:
        return VarianceFlag.objects.all()

    roles_set = set(roles)

    return VarianceFlag.objects.filter(
        project__memberships__user=user,
        project__memberships__role__in=roles_set,
    ).distinct()


def visible_variance_action_logs_queryset(
    user: AbstractBaseUser,
) -> QuerySet[VarianceActionLog]:
    ctx = _get_visibility_context(user)

    queryset = VarianceActionLog.objects.select_related(
        "variance_flag",
        "variance_flag__project",
        "actor",
    )

    if ctx.can_see_all_projects:
        return queryset

    return queryset.filter(variance_flag__project__memberships__user=user).distinct()
