from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Iterable

from django.db.models import Exists, OuterRef, QuerySet

from apps.evidence.models import EvidenceItem, EvidenceLink
from apps.projects.models import Project, ProjectMembership

if TYPE_CHECKING:
    from django.contrib.auth.models import AbstractBaseUser


@dataclass(frozen=True)
class EvidenceVisibilityContext:
    """Resolved evidence visibility context for a user."""

    can_see_all_projects: bool


def _get_visibility_context(user: AbstractBaseUser) -> EvidenceVisibilityContext:
    if not user or not getattr(user, "is_authenticated", False):
        return EvidenceVisibilityContext(can_see_all_projects=False)

    if user.is_superuser:
        return EvidenceVisibilityContext(can_see_all_projects=True)

    user_groups = set(user.groups.values_list("name", flat=True))
    return EvidenceVisibilityContext(can_see_all_projects=("admin" in user_groups))


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


def visible_evidence_items_queryset(user: AbstractBaseUser) -> QuerySet[EvidenceItem]:
    """Evidence items visible to the user.

    Visibility is derived from project membership.
    """

    ctx = _get_visibility_context(user)

    queryset = EvidenceItem.objects.select_related(
        "project",
        "uploaded_by",
        "verified_by",
    ).filter(is_deleted=False)

    if ctx.can_see_all_projects:
        return queryset

    return queryset.filter(project__memberships__user=user).distinct()


def visible_evidence_item_ids(user: AbstractBaseUser) -> QuerySet:
    """Convenience selector returning IDs for visible evidence items."""

    return visible_evidence_items_queryset(user).values_list("id", flat=True)



def visible_evidence_items_by_project_roles(
    user: AbstractBaseUser,
    roles: Iterable[str],
) -> QuerySet[EvidenceItem]:
    """Visible evidence items restricted to projects where membership.role in roles."""

    ctx = _get_visibility_context(user)

    if ctx.can_see_all_projects:
        return EvidenceItem.objects.select_related("project").filter(is_deleted=False)

    roles_set = set(roles)

    return (
        EvidenceItem.objects.select_related("project", "uploaded_by", "verified_by")
        .filter(is_deleted=False)
        .filter(project__memberships__user=user, project__memberships__role__in=roles_set)
        .distinct()
    )


def visible_evidence_links_queryset(user: AbstractBaseUser) -> QuerySet[EvidenceLink]:
    """EvidenceLink queryset visible to the user via project membership."""

    ctx = _get_visibility_context(user)

    queryset = EvidenceLink.objects.select_related(
        "evidence",
        "execution_record_version",
        "linked_by",
    )

    if ctx.can_see_all_projects:
        return queryset

    return queryset.filter(
        evidence__project__memberships__user=user
    ).distinct()

