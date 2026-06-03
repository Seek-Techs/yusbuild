from django.db import transaction

from apps.audit.models import EventType
from apps.audit.services.audit_service import record_audit_event
from apps.audit.services.timeline_service import record_timeline_event
from apps.execution.models import (
    DrivingResistanceLog,
    ExecutionRecord,
    ExecutionRecordState,
    ExecutionRecordType,
    ExecutionRecordVersion,
    PileDrivingRecord,
    make_snapshot_hash,
)
from apps.execution.services.state_machine import ensure_transition_allowed


@transaction.atomic
def create_draft_driving_record(validated_data: dict, actor):
    """Create the workflow header, driving record, and resistance logs."""
    logs_data = validated_data.pop("resistance_logs", [])
    project = validated_data["project"]
    pile = validated_data["pile"]
    execution_record = ExecutionRecord.objects.create(
        project=project,
        pile=pile,
        record_type=ExecutionRecordType.PILE_DRIVING,
        contractor=actor if getattr(actor, "is_authenticated", False) else None,
        created_by=actor if getattr(actor, "is_authenticated", False) else None,
    )
    driving_record = PileDrivingRecord.objects.create(
        execution_record=execution_record,
        **validated_data,
    )
    DrivingResistanceLog.objects.bulk_create(
        [
            DrivingResistanceLog(driving_record=driving_record, **log_data)
            for log_data in logs_data
        ]
    )
    return driving_record


@transaction.atomic
def update_draft_driving_record(
    driving_record: PileDrivingRecord, 
    validated_data: dict
    ):
    """Update a mutable draft/returned driving record and replace draft log rows."""
    logs_data = validated_data.pop("resistance_logs", None)
    locked_record = PileDrivingRecord.objects.select_for_update().get(
        pk=driving_record.pk
    )
    if not locked_record.execution_record.is_editable:
        raise ValueError("Submitted execution records are immutable.")

    for field, value in validated_data.items():
        setattr(locked_record, field, value)
    locked_record.save()

    if logs_data is not None:
        locked_record.resistance_logs.all().delete()
        DrivingResistanceLog.objects.bulk_create(
            [
                DrivingResistanceLog(driving_record=locked_record, **log_data)
                for log_data in logs_data
            ]
        )
    return locked_record


@transaction.atomic
def submit_execution_record(execution_record: ExecutionRecord, actor):
    """Create an immutable submitted version and move the header to SUBMITTED."""
    locked_record = (
        ExecutionRecord.objects.select_for_update()
        .get(pk=execution_record.pk)
    )

    ensure_transition_allowed(
        locked_record.current_state,
        ExecutionRecordState.SUBMITTED,
    )

    snapshot = build_execution_snapshot(locked_record)
    version = ExecutionRecordVersion.objects.create(
        execution_record=locked_record,
        version_no=locked_record.current_version_no + 1,
        submitted_by=actor if getattr(actor, "is_authenticated", False) else None,
        data_snapshot=snapshot,
        source_record_hash=make_snapshot_hash(snapshot),
        supersedes_version=locked_record.latest_version,
    )
    locked_record.mark_submitted(actor, version)
    locked_record.save(
        update_fields=[
            "current_state",
            "current_version_no",
            "latest_version",
            "submitted_by",
            "submitted_at",
            "updated_at",
        ]
    )

    record_timeline_event(
        actor,
        locked_record.project,
        locked_record.pile,
        EventType.EXECUTION_SUBMISSION,
        {
            "execution_record_id": locked_record.id,
            "execution_record_version_id": version.id,
            "version_no": version.version_no,
        },
    )
    record_audit_event(
        actor,
        locked_record.project,
        locked_record.pile,
        EventType.EXECUTION_SUBMISSION,
        {
            "execution_record_id": locked_record.id,
            "execution_record_version_id": version.id,
            "version_no": version.version_no,
        },
    )
    return version


def build_execution_snapshot(execution_record: ExecutionRecord) -> dict:
    driving_record = execution_record.pile_driving_record
    logs = [
        {
            "sequence_no": log.sequence_no,
            "depth_from_m": log.depth_from_m,
            "depth_to_m": log.depth_to_m,
            "penetration_mm": log.penetration_mm,
            "blow_count": log.blow_count,
            "set_per_blow": log.set_per_blow,
            "notes": log.notes,
        }
        for log in driving_record.resistance_logs.order_by("sequence_no", "id")
    ]
    return {
        "execution_record": {
            "id": execution_record.id,
            "record_type": execution_record.record_type,
            "project_id": execution_record.project_id,
            "pile_id": execution_record.pile_id,
        },
        "pile_driving_record": {
            "id": driving_record.id,
            "project_id": driving_record.project_id,
            "pile_id": driving_record.pile_id,
            "start_time": driving_record.start_time.isoformat(),
            "end_time": driving_record.end_time.isoformat(),
            "reported_depth_m": driving_record.reported_depth_m,
            "verified_depth_m": driving_record.verified_depth_m,
            "hammer_type": driving_record.hammer_type,
            "hammer_energy": driving_record.hammer_energy,
            "final_set": driving_record.final_set,
            "total_blows": driving_record.total_blows,
            "remarks": driving_record.remarks,
            "contractor_comments": driving_record.contractor_comments,
        },
        "driving_resistance_logs": logs,
    }
