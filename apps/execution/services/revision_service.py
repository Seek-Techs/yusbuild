from django.db import transaction

from apps.audit.models import EventType
from apps.audit.services.audit_service import record_audit_event
from apps.audit.services.timeline_service import record_timeline_event
from apps.execution.models import (
    DrivingResistanceLog,
    ExecutionRecord,
    ExecutionRecordState,
)
from apps.execution.services.state_machine import ensure_transition_allowed
from apps.execution.services.submission_service import submit_execution_record


@transaction.atomic
def return_record_for_correction(execution_record: ExecutionRecord):
    """Move a submitted/reviewed record back for contractor correction."""
    locked_record = ExecutionRecord.objects.select_for_update().get(
        pk=execution_record.pk
    )
    ensure_transition_allowed(
        locked_record.current_state,
        ExecutionRecordState.RETURNED_FOR_CORRECTION,
    )
    locked_record.current_state = ExecutionRecordState.RETURNED_FOR_CORRECTION
    locked_record.save(update_fields=["current_state", "updated_at"])
    return locked_record


@transaction.atomic
def create_revision_from_record(
    execution_record: ExecutionRecord,
    actor,
    *,
    revision_data: dict | None = None,
):
    """
    Apply contractor corrections and submit a new immutable version.

    The previous submitted version remains untouched and is linked through
    supersedes_version on the new version.
    """
    locked_record = (
        ExecutionRecord.objects.select_for_update()
        .get(pk=execution_record.pk)
    )
    ensure_transition_allowed(
        locked_record.current_state,
        ExecutionRecordState.SUBMITTED,
    )

    if revision_data:
        logs_data = revision_data.pop("resistance_logs", None)
        driving_record = locked_record.pile_driving_record
        for field, value in revision_data.items():
            setattr(driving_record, field, value)
        driving_record.save()
        if logs_data is not None:
            driving_record.resistance_logs.all().delete()
            DrivingResistanceLog.objects.bulk_create(
                [
                    DrivingResistanceLog(driving_record=driving_record, **log_data)
                    for log_data in logs_data
                ]
            )

    version = submit_execution_record(locked_record, actor)
    record_timeline_event(
        actor,
        version.execution_record.project,
        version.execution_record.pile,
        EventType.EXECUTION_REVISION,
        {
            "execution_record_version_id": version.id,
            "version_no": version.version_no,
            "supersedes_version_id": version.supersedes_version_id,
        },
    )
    record_audit_event(
        actor,
        version.execution_record.project,
        version.execution_record.pile,
        EventType.EXECUTION_REVISION,
        {
            "execution_record_version_id": version.id,
            "version_no": version.version_no,
            "supersedes_version_id": version.supersedes_version_id,
        },
    )
    return version
