from django.db import transaction

from apps.audit.models import AuditEvent


def _actor_or_none(actor):
    return actor if getattr(actor, "is_authenticated", False) else None


@transaction.atomic
def record_audit_event(actor, project, pile, event_type, metadata=None):
    return AuditEvent.objects.create(
        actor=_actor_or_none(actor),
        project=project,
        pile=pile,
        event_type=event_type,
        metadata=metadata or {},
    )
