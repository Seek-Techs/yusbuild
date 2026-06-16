from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Iterable

from django.db.models import Exists, OuterRef, QuerySet

from apps.certification.models import CertificationPackage
from apps.projects.models import Project, ProjectMembership

if TYPE_CHECKING:
    from django.contrib.auth.models import AbstractBaseUser


@dataclass(frozen=True)
class CertificationVisibilityContext:
    can_see_all_projects: bool


def _get_visibility_context(user: AbstractBaseUser) -> CertificationVisibilityContext:
    if not user or not getattr(user, "is_authenticated", False):
        return CertificationVisibilityContext(can_see_all_projects=False)

    if user.is_superuser:
        return CertificationVisibilityContext(can_see_all_projects=True)

    user_groups = set(user.groups.values_list("name", flat=True))
    return CertificationVisibilityContext(can_see_all_projects=("admin" in user_groups))


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


def visible_certification_packages_queryset(
    user: AbstractBaseUser,
) -> QuerySet[CertificationPackage]:
    ctx = _get_visibility_context(user)

    queryset = CertificationPackage.objects.select_related(
        "project",
        "created_by",
        "submitted_by",
        "approved_by",
        "certified_by",
    ).prefetch_related(
        "lines",
        "lines__pile",
        "lines__certified_quantity",
        "certified_quantities",
        "certified_quantities__pile",
    )

    if ctx.can_see_all_projects:
        return queryset

    return queryset.filter(project__memberships__user=user).distinct()


def visible_certification_package_ids(user: AbstractBaseUser) -> QuerySet:
    return visible_certification_packages_queryset(user).values_list("id", flat=True)


def visible_certification_packages_by_project_roles(
    user: AbstractBaseUser,
    roles: Iterable[str],
) -> QuerySet[CertificationPackage]:
    ctx = _get_visibility_context(user)

    if ctx.can_see_all_projects:
        return CertificationPackage.objects.all()

    roles_set = set(roles)

    return CertificationPackage.objects.filter(
        project__memberships__user=user,
        project__memberships__role__in=roles_set,
    ).distinct()

