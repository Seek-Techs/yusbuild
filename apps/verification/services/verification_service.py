from django.db import transaction
from django.utils import timezone

from apps.audit.models import EventType
from apps.audit.services.audit_service import record_audit_event
from apps.audit.services.timeline_service import record_timeline_event
from apps.execution.models import ExecutionRecordVersion
from apps.verification.models import (
    VarianceFlag,
    VarianceStatus,
    VerificationActionLog,
)
from apps.verification.services.rule_engine import (
    build_context,
    run_approval_checks,
    run_blow_count_checks,
    run_concrete_checks,
    run_depth_checks,
    run_evidence_checks,
    run_reinforcement_checks,
)

RULE_CHECKS = [
    run_depth_checks,
    run_concrete_checks,
    run_reinforcement_checks,
    run_evidence_checks,
    run_approval_checks,
    run_blow_count_checks,
]

ALLOWED_FLAG_TRANSITIONS = {
    VarianceStatus.OPEN: {
        VarianceStatus.ACKNOWLEDGED,
        VarianceStatus.RESOLVED,
        VarianceStatus.WAIVED,
    },
    VarianceStatus.ACKNOWLEDGED: {
        VarianceStatus.RESOLVED,
        VarianceStatus.WAIVED,
    },
    VarianceStatus.RESOLVED: set(),
    VarianceStatus.WAIVED: set(),
}


class InvalidVarianceFlagTransition(ValueError):
    """Raised when a variance flag status transition is not allowed."""


def _actor_or_none(actor):
    return actor if getattr(actor, "is_authenticated", False) else None


@transaction.atomic
def run_verification_checks(execution_record_version: ExecutionRecordVersion):
    context = build_context(execution_record_version)
    flags = []
    for check in RULE_CHECKS:
        flags.extend(check(context))
    flags = sorted(flags, key=lambda flag: (flag.category, flag.rule_code, flag.id))
    
    if flags:
        record_timeline_event(
            None,
            execution_record_version.execution_record.project,
            execution_record_version.execution_record.pile,
            EventType.VERIFICATION_RUN,
            {
                "execution_record_version_id": execution_record_version.id,
                "flag_count": len(flags),
            },
        )
        record_audit_event(
            None,
            execution_record_version.execution_record.project,
            execution_record_version.execution_record.pile,
            EventType.VERIFICATION_RUN,
            {
                "execution_record_version_id": execution_record_version.id,
                "flag_count": len(flags),
            },
        )
    
    return flags



def _transition_flag(flag: VarianceFlag, actor, *, status: str, comment: str = ""):
    locked_flag = VarianceFlag.objects.select_for_update().get(pk=flag.pk)
    previous_status = locked_flag.status
    allowed_statuses = ALLOWED_FLAG_TRANSITIONS.get(previous_status, set())
    if status not in allowed_statuses:
        raise InvalidVarianceFlagTransition(
            f"Cannot transition variance flag from {previous_status} to {status}."
        )
    locked_flag.status = status
    if status in {VarianceStatus.RESOLVED, VarianceStatus.WAIVED}:
        locked_flag.resolved_by = _actor_or_none(actor)
        locked_flag.resolved_at = timezone.now()
        locked_flag.resolution_comment = comment
    elif status == VarianceStatus.ACKNOWLEDGED:
        locked_flag.resolution_comment = comment
    locked_flag.save(
        update_fields=[
            "status",
            "resolved_by",
            "resolved_at",
            "resolution_comment",
        ]
    )
    VerificationActionLog.objects.create(
        variance_flag=locked_flag,
        actor=_actor_or_none(actor),
        action=status,
        previous_status=previous_status,
        new_status=status,
        comment=comment,
    )
    return locked_flag


@transaction.atomic
def acknowledge_flag(flag: VarianceFlag, actor, comment: str = ""):
    return _transition_flag(
        flag,
        actor,
        status=VarianceStatus.ACKNOWLEDGED,
        comment=comment,
    )


@transaction.atomic
def resolve_flag(flag: VarianceFlag, actor, comment: str = ""):
    return _transition_flag(
        flag,
        actor,
        status=VarianceStatus.RESOLVED,
        comment=comment,
    )


@transaction.atomic
def waive_flag(flag: VarianceFlag, actor, comment: str = ""):
    return _transition_flag(
        flag,
        actor,
        status=VarianceStatus.WAIVED,
        comment=comment,
    )
