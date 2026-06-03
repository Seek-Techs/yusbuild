from django.db import transaction

from apps.audit.models import TimelineEvent


def _actor_or_none(actor):
    return actor if getattr(actor, "is_authenticated", False) else None


@transaction.atomic
def record_timeline_event(actor, project, pile, event_type, metadata=None):
    return TimelineEvent.objects.create(
        actor=_actor_or_none(actor),
        project=project,
        pile=pile,
        event_type=event_type,
        metadata=metadata or {},
    )


def list_timeline_events(project_id=None, pile_id=None):
    queryset = TimelineEvent.objects.select_related(
        "actor",
        "project",
        "pile",
    )
    if project_id is not None:
        queryset = queryset.filter(project_id=project_id)
    if pile_id is not None:
        queryset = queryset.filter(pile_id=pile_id)
    return queryset.order_by("-timestamp", "-id")


def get_project_timeline(project_id):
    return list_timeline_events(project_id=project_id)


def get_pile_timeline(pile_id):
    return list_timeline_events(pile_id=pile_id)
