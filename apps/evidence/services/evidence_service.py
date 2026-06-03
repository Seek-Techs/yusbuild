import hashlib

from django.db import transaction
from django.utils import timezone

from apps.audit.models import EventType
from apps.audit.services.audit_service import record_audit_event
from apps.audit.services.timeline_service import record_timeline_event
from apps.evidence.models import (
    EvidenceItem,
    EvidenceLink,
)
from apps.execution.models import ExecutionRecordState, ExecutionRecordVersion


def _actor_or_none(actor):
    return actor if getattr(actor, "is_authenticated", False) else None


def _calculate_sha256(uploaded_file) -> str:
    digest = hashlib.sha256()
    for chunk in uploaded_file.chunks():
        digest.update(chunk)
    uploaded_file.seek(0)
    return digest.hexdigest()


def duplicate_hash_warnings(sha256_hash: str) -> list[dict]:
    duplicates = EvidenceItem.objects.filter(
        sha256_hash=sha256_hash,
        is_deleted=False,
    ).order_by("id")
    return [
        {
            "code": "duplicate_sha256",
            "evidence_id": duplicate.id,
            "sha256_hash": sha256_hash,
        }
        for duplicate in duplicates
    ]


@transaction.atomic
def upload_evidence(validated_data: dict, actor):
    uploaded_file = validated_data["file"]
    sha256_hash = _calculate_sha256(uploaded_file)
    warnings = duplicate_hash_warnings(sha256_hash)
    evidence = EvidenceItem.objects.create(
        project=validated_data["project"],
        uploaded_by=_actor_or_none(actor),
        file=uploaded_file,
        original_filename=uploaded_file.name,
        content_type=getattr(uploaded_file, "content_type", "") or "",
        file_size=uploaded_file.size,
        sha256_hash=sha256_hash,
        captured_at=validated_data.get("captured_at"),
        gps_lat=validated_data.get("gps_lat"),
        gps_lng=validated_data.get("gps_lng"),
        device_metadata=validated_data.get("device_metadata", {}),
        evidence_type=validated_data["evidence_type"],
    )
    return evidence, warnings


@transaction.atomic
def verify_evidence(evidence: EvidenceItem, actor, *, verification_status: str):
    locked_evidence = EvidenceItem.objects.select_for_update().get(pk=evidence.pk)
    locked_evidence.verification_status = verification_status
    locked_evidence.verified_by = _actor_or_none(actor)
    locked_evidence.verified_at = timezone.now()
    locked_evidence.save(
        update_fields=[
            "verification_status",
            "verified_by",
            "verified_at",
        ]
    )
    return locked_evidence


@transaction.atomic
def link_evidence_to_version(
    evidence: EvidenceItem,
    execution_record_version: ExecutionRecordVersion,
    actor,
    *,
    is_primary: bool = False,
):
    locked_evidence = EvidenceItem.objects.select_for_update().get(pk=evidence.pk)
    if locked_evidence.is_deleted:
        raise ValueError("Deleted evidence cannot be linked.")

    version = (
        ExecutionRecordVersion.objects.select_related("execution_record")
        .select_for_update()
        .get(pk=execution_record_version.pk)
    )
    if locked_evidence.project_id != version.execution_record.project_id:
        raise ValueError("Evidence and execution record version must share a project.")

    if is_primary:
        EvidenceLink.objects.filter(
            execution_record_version=version,
            is_primary=True,
        ).update(is_primary=False)

    evidence_link = EvidenceLink.objects.create(
        evidence=locked_evidence,
        execution_record_version=version,
        linked_by=_actor_or_none(actor),
        is_primary=is_primary,
    )

    record_timeline_event(
        actor,
        locked_evidence.project,
        version.execution_record.pile,
        EventType.EVIDENCE_LINKED,
        {
            "evidence_link_id": evidence_link.id,
            "evidence_id": locked_evidence.id,
            "execution_record_version_id": version.id,
            "is_primary": is_primary,
        },
    )
    record_audit_event(
        actor,
        locked_evidence.project,
        version.execution_record.pile,
        EventType.EVIDENCE_LINKED,
        {
            "evidence_link_id": evidence_link.id,
            "evidence_id": locked_evidence.id,
            "execution_record_version_id": version.id,
            "is_primary": is_primary,
        },
    )
    return evidence_link


@transaction.atomic
def soft_delete_evidence(evidence: EvidenceItem):
    locked_evidence = EvidenceItem.objects.select_for_update().get(pk=evidence.pk)
    if locked_evidence.links.filter(
        execution_record_version__execution_record__current_state=(
            ExecutionRecordState.APPROVED
        )
    ).exists():
        raise ValueError("Evidence linked to approved versions cannot be removed.")
    locked_evidence.is_deleted = True
    locked_evidence.save(update_fields=["is_deleted"])
    return locked_evidence
