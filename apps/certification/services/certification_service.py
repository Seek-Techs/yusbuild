from django.db import transaction
from django.utils import timezone

from apps.audit.models import EventType
from apps.audit.services.audit_service import record_audit_event
from apps.audit.services.timeline_service import record_timeline_event
from apps.certification.models import (
    CertificationLine,
    CertificationPackage,
    CertificationPackageState,
    CertifiedQuantity,
)
from apps.certification.services.package_service import (
    _get_package_primary_pile,
    actor_or_none,
    ensure_package_transition_allowed,
)
from apps.execution.models import ExecutionRecordState


def _source_version_is_certifiable(source_version) -> bool:
    execution_record = source_version.execution_record
    return (
        execution_record.current_state == ExecutionRecordState.APPROVED
        and execution_record.latest_version_id == source_version.id
    )


def _line_snapshot(line: CertificationLine) -> dict:
    return {
        "certification_line_id": line.id,
        "pile_id": line.pile_id,
        "pile_no": line.pile.pile_no,
        "source_execution_version_id": line.source_execution_version_id,
        "source_record_hash": line.source_execution_version.source_record_hash,
        "certified_depth_m": line.certified_depth_m,
        "certified_concrete_m3": line.certified_concrete_m3,
        "certified_reinforcement_kg": line.certified_reinforcement_kg,
    }


@transaction.atomic
def create_certification_package(validated_data: dict, actor):
    return CertificationPackage.objects.create(
        created_by=actor_or_none(actor),
        **validated_data,
    )


@transaction.atomic
def update_draft_package(package: CertificationPackage, validated_data: dict):
    locked_package = CertificationPackage.objects.select_for_update().get(pk=package.pk)
    if not locked_package.is_editable:
        raise ValueError("Only draft certification packages can be updated.")
    for field, value in validated_data.items():
        setattr(locked_package, field, value)
    locked_package.save()
    return locked_package


@transaction.atomic
def add_certification_line(package: CertificationPackage, validated_data: dict):
    locked_package = CertificationPackage.objects.select_for_update().get(pk=package.pk)
    if not locked_package.is_editable:
        raise ValueError("Certification lines can only be added to draft packages.")

    source_version = validated_data["source_execution_version"]
    source_version = source_version.__class__.objects.select_related(
        "execution_record",
        "execution_record__pile",
        "execution_record__project",
    ).get(pk=source_version.pk)
    pile = validated_data["pile"]

    if not _source_version_is_certifiable(source_version):
        raise ValueError("Certification can only consume approved execution versions.")
    if source_version.execution_record.project_id != locked_package.project_id:
        raise ValueError("Source execution version must belong to the package project.")
    if source_version.execution_record.pile_id != pile.id:
        raise ValueError("Pile must match the source execution version.")

    line = CertificationLine.objects.create(package=locked_package, **validated_data)
    line.quantity_snapshot = _line_snapshot(line)
    line.save(update_fields=["quantity_snapshot", "updated_at"])
    return line


@transaction.atomic
def certify_package(package: CertificationPackage, actor):
    locked_package = (
        CertificationPackage.objects.select_for_update()
        .prefetch_related("lines")
        .get(pk=package.pk)
    )
    ensure_package_transition_allowed(
        locked_package.current_state,
        CertificationPackageState.CERTIFIED,
    )
    lines = list(
        locked_package.lines.select_related(
            "pile",
            "source_execution_version",
            "source_execution_version__execution_record",
        )
    )
    if not lines:
        raise ValueError("Certification package must contain at least one line.")

    frozen_lines = []
    certified_quantities = []
    certified_at = timezone.now()
    for line in lines:
        if not _source_version_is_certifiable(line.source_execution_version):
            raise ValueError(
                "All certification lines must reference approved execution versions."
            )
        snapshot = _line_snapshot(line)
        frozen_lines.append(snapshot)
        certified_quantities.append(
            CertifiedQuantity(
                package=locked_package,
                certification_line=line,
                pile=line.pile,
                source_execution_version=line.source_execution_version,
                certified_depth_m=line.certified_depth_m,
                certified_concrete_m3=line.certified_concrete_m3,
                certified_reinforcement_kg=line.certified_reinforcement_kg,
                frozen_snapshot=snapshot,
                certified_by=actor_or_none(actor),
                certified_at=certified_at,
            )
        )

    CertifiedQuantity.objects.bulk_create(certified_quantities)
    for line in lines:
        execution_record = line.source_execution_version.execution_record
        execution_record.current_state = ExecutionRecordState.CERTIFIED
        execution_record.save(update_fields=["current_state", "updated_at"])

    locked_package.current_state = CertificationPackageState.CERTIFIED
    locked_package.certified_by = actor_or_none(actor)
    locked_package.certified_at = certified_at
    locked_package.quantity_snapshot = {
        "package_id": locked_package.id,
        "package_no": locked_package.package_no,
        "certified_at": certified_at.isoformat(),
        "line_count": len(frozen_lines),
        "totals": {
            "certified_depth_m": sum(
                line["certified_depth_m"] for line in frozen_lines
            ),
            "certified_concrete_m3": sum(
                line["certified_concrete_m3"] for line in frozen_lines
            ),
            "certified_reinforcement_kg": sum(
                line["certified_reinforcement_kg"] for line in frozen_lines
            ),
        },
        "lines": frozen_lines,
    }
    locked_package.save(
        update_fields=[
            "current_state",
            "certified_by",
            "certified_at",
            "quantity_snapshot",
            "updated_at",
        ]
    )
    primary_pile = _get_package_primary_pile(locked_package)
    metadata = {
        "certification_package_id": locked_package.id,
        "package_no": locked_package.package_no,
        "pile_ids": list(locked_package.lines.values_list("pile_id", flat=True)),
    }
    record_timeline_event(
        actor,
        locked_package.project,
        primary_pile,
        EventType.CERTIFICATION_CERTIFIED,
        metadata,
    )
    record_audit_event(
        actor,
        locked_package.project,
        primary_pile,
        EventType.CERTIFICATION_CERTIFIED,
        metadata,
    )
    return locked_package
