from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING


from django.db.models import Exists, OuterRef, QuerySet

from apps.audit.models import TimelineEvent
from apps.projects.models import Project, ProjectMembership

if TYPE_CHECKING:
    from django.contrib.auth.models import AbstractBaseUser


@dataclass(frozen=True)
class AuditVisibilityContext:
    can_see_all_projects: bool


def _get_visibility_context(user: AbstractBaseUser) -> AuditVisibilityContext:
    if not user or not getattr(user, "is_authenticated", False):
        return AuditVisibilityContext(can_see_all_projects=False)

    if user.is_superuser:
        return AuditVisibilityContext(can_see_all_projects=True)

    user_groups = set(user.groups.values_list("name", flat=True))
    return AuditVisibilityContext(can_see_all_projects=("admin" in user_groups))


def visible_timeline_events_queryset(
    user: AbstractBaseUser,
) -> QuerySet[TimelineEvent]:
    """Timeline events visible to the given user.

    Rules:
    - superuser/admin group: all projects
    - otherwise: events where the event.project is assigned to the user
    """

    ctx = _get_visibility_context(user)
    qs = TimelineEvent.objects.select_related(
        "actor",
        "project",
        "pile",
    )

    if ctx.can_see_all_projects:
        return qs.all()

    membership_qs = ProjectMembership.objects.filter(
        project_id=OuterRef("project_id"),
        user=user,
    )

    return qs.annotate(_has_membership=Exists(membership_qs)).filter(
        _has_membership=True
    )


def visible_timeline_event_ids(user: AbstractBaseUser) -> QuerySet:
    return visible_timeline_events_queryset(user).values_list("id", flat=True)


def visible_projects_queryset(user: AbstractBaseUser) -> QuerySet[Project]:
    """Projects visible to the given user (authorization helper)."""

    ctx = _get_visibility_context(user)
    base_qs = Project.objects.all()

    if ctx.can_see_all_projects:
        return base_qs

    membership_qs = ProjectMembership.objects.filter(
        project_id=OuterRef("pk"),
        user=user,
    )

    return base_qs.annotate(_has_membership=Exists(membership_qs)).filter(
        _has_membership=True
    )
