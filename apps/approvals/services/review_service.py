from django.db import transaction

from apps.approvals.models import ApprovalActionLog, ConsultantComment


def _actor_or_none(actor):
    return actor if getattr(actor, "is_authenticated", False) else None


@transaction.atomic
def add_consultant_comment(execution_record_version, actor, comment: str):
    version = (
        execution_record_version.__class__.objects.select_for_update()
        .select_related("execution_record")
        .get(pk=execution_record_version.pk)
    )
    consultant_comment = ConsultantComment.objects.create(
        execution_record_version=version,
        author=_actor_or_none(actor),
        comment=comment,
    )
    ApprovalActionLog.objects.create(
        execution_record_version=version,
        actor=_actor_or_none(actor),
        action="comment",
        metadata={"consultant_comment_id": consultant_comment.id},
    )
    return consultant_comment
