from django.db import transaction

from apps.approvals.models import (
    ApprovalActionLog,
    ApprovalDecision,
    ApprovalDecisionType,
)
from apps.audit.models import EventType
from apps.audit.services.audit_service import record_audit_event
from apps.audit.services.timeline_service import record_timeline_event
from apps.execution.models import ExecutionRecord, ExecutionRecordState
from apps.execution.services.state_machine import ensure_transition_allowed


def _actor_or_none(actor):
    return actor if getattr(actor, "is_authenticated", False) else None


def _lock_current_version(execution_record_version):
    version = (
        execution_record_version.__class__.objects.select_related(
            "execution_record",
        )
        .select_for_update()
        .get(pk=execution_record_version.pk)
    )
    record = ExecutionRecord.objects.select_for_update().get(
        pk=version.execution_record_id
    )
    if record.latest_version_id != version.id:
        raise ValueError("Approval decisions must target the latest submitted version.")
    return version, record


def _enter_review(record):
    if record.current_state == ExecutionRecordState.SUBMITTED:
        ensure_transition_allowed(
            record.current_state,
            ExecutionRecordState.UNDER_REVIEW,
        )
        record.current_state = ExecutionRecordState.UNDER_REVIEW
        record.save(update_fields=["current_state", "updated_at"])


def _log_action(version, actor, action: str, metadata: dict | None = None):
    return ApprovalActionLog.objects.create(
        execution_record_version=version,
        actor=_actor_or_none(actor),
        action=action,
        metadata=metadata or {},
    )


def _record_decision(
    execution_record_version,
    actor,
    *,
    decision: str,
    target_state: str,
    comments: str = "",
):
    version, record = _lock_current_version(execution_record_version)
    _enter_review(record)
    previous_state = record.current_state
    ensure_transition_allowed(previous_state, target_state)
    record.current_state = target_state
    record.save(update_fields=["current_state", "updated_at"])

    approval_decision = ApprovalDecision.objects.create(
        execution_record_version=version,
        decision=decision,
        decided_by=_actor_or_none(actor),
        comments=comments,
        previous_state=previous_state,
        new_state=target_state,
    )
    _log_action(
        version,
        actor,
        decision,
        {
            "approval_decision_id": approval_decision.id,
            "previous_state": previous_state,
            "new_state": target_state,
        },
    )
    record_timeline_event(
        actor,
        version.execution_record.project,
        version.execution_record.pile,
        EventType.APPROVAL_DECISION,
        {
            "approval_decision_id": approval_decision.id,
            "decision": decision,
            "target_state": target_state,
        },
    )
    record_audit_event(
        actor,
        version.execution_record.project,
        version.execution_record.pile,
        EventType.APPROVAL_DECISION,
        {
            "approval_decision_id": approval_decision.id,
            "decision": decision,
            "target_state": target_state,
        },
    )
    return approval_decision


@transaction.atomic
def approve_record_version(execution_record_version, actor, comments: str = ""):
    return _record_decision(
        execution_record_version,
        actor,
        decision=ApprovalDecisionType.APPROVE,
        target_state=ExecutionRecordState.APPROVED,
        comments=comments,
    )


@transaction.atomic
def approve_record_version_with_comments(
    execution_record_version,
    actor,
    comments: str = "",
):
    return _record_decision(
        execution_record_version,
        actor,
        decision=ApprovalDecisionType.APPROVE_WITH_COMMENTS,
        target_state=ExecutionRecordState.APPROVED,
        comments=comments,
    )


@transaction.atomic
def reject_record_version(execution_record_version, actor, comments: str = ""):
    return _record_decision(
        execution_record_version,
        actor,
        decision=ApprovalDecisionType.REJECT,
        target_state=ExecutionRecordState.REJECTED,
        comments=comments,
    )


@transaction.atomic
def return_record_for_correction(execution_record_version, actor, comments: str = ""):
    return _record_decision(
        execution_record_version,
        actor,
        decision=ApprovalDecisionType.RETURN_FOR_CORRECTION,
        target_state=ExecutionRecordState.RETURNED_FOR_CORRECTION,
        comments=comments,
    )
