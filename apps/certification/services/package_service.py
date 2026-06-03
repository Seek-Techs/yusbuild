from dataclasses import dataclass

from django.db import transaction
from django.utils import timezone

from apps.audit.models import EventType
from apps.audit.services.audit_service import record_audit_event
from apps.audit.services.timeline_service import record_timeline_event
from apps.certification.models import (
    CertificationPackage,
    CertificationPackageState,
)


class InvalidCertificationTransition(ValueError):
    """Raised when a certification package transition is not allowed."""


ALLOWED_PACKAGE_TRANSITIONS = {
    CertificationPackageState.DRAFT: {CertificationPackageState.SUBMITTED},
    CertificationPackageState.SUBMITTED: {CertificationPackageState.APPROVED},
    CertificationPackageState.APPROVED: {CertificationPackageState.CERTIFIED},
    CertificationPackageState.CERTIFIED: {CertificationPackageState.LOCKED},
    CertificationPackageState.LOCKED: set(),
}


@dataclass(frozen=True)
class PackageTransitionResult:
    from_state: str
    to_state: str


def actor_or_none(actor):
    return actor if getattr(actor, "is_authenticated", False) else None


def ensure_package_transition_allowed(
    from_state: str,
    to_state: str,
) -> PackageTransitionResult:
    if to_state not in ALLOWED_PACKAGE_TRANSITIONS.get(from_state, set()):
        raise InvalidCertificationTransition(
            f"Cannot transition certification package from {from_state} to {to_state}."
        )
    return PackageTransitionResult(from_state=from_state, to_state=to_state)


def _get_package_primary_pile(package: CertificationPackage):
    primary_line = (
        package.lines.select_related("pile").order_by("id").first()
    )
    if primary_line is None:
        raise ValueError("Certification package must contain at least one line.")
    return primary_line.pile


def _get_package_event_metadata(package: CertificationPackage, event_metadata: dict):
    return {
        **(event_metadata or {}),
        "certification_package_id": package.id,
        "package_no": package.package_no,
        "pile_ids": list(package.lines.values_list("pile_id", flat=True)),
    }


@transaction.atomic
def submit_package(package: CertificationPackage, actor):
    locked_package = CertificationPackage.objects.select_for_update().get(pk=package.pk)
    ensure_package_transition_allowed(
        locked_package.current_state,
        CertificationPackageState.SUBMITTED,
    )
    if not locked_package.lines.exists():
        raise ValueError("Certification package must contain at least one line.")

    locked_package.current_state = CertificationPackageState.SUBMITTED
    locked_package.submitted_by = actor_or_none(actor)
    locked_package.submitted_at = timezone.now()
    locked_package.save(
        update_fields=[
            "current_state",
            "submitted_by",
            "submitted_at",
            "updated_at",
        ]
    )
    primary_pile = _get_package_primary_pile(locked_package)
    metadata = _get_package_event_metadata(
        locked_package,
        {
            "certification_package_id": locked_package.id,
            "package_no": locked_package.package_no,
        },
    )
    record_timeline_event(
        actor,
        locked_package.project,
        primary_pile,
        EventType.CERTIFICATION_SUBMITTED,
        metadata,
    )
    record_audit_event(
        actor,
        locked_package.project,
        primary_pile,
        EventType.CERTIFICATION_SUBMITTED,
        metadata,
    )
    return locked_package


@transaction.atomic
def approve_package(package: CertificationPackage, actor):
    locked_package = CertificationPackage.objects.select_for_update().get(pk=package.pk)
    ensure_package_transition_allowed(
        locked_package.current_state,
        CertificationPackageState.APPROVED,
    )
    locked_package.current_state = CertificationPackageState.APPROVED
    locked_package.approved_by = actor_or_none(actor)
    locked_package.approved_at = timezone.now()
    locked_package.save(
        update_fields=[
            "current_state",
            "approved_by",
            "approved_at",
            "updated_at",
        ]
    )
    primary_pile = _get_package_primary_pile(locked_package)
    metadata = _get_package_event_metadata(
        locked_package,
        {
            "certification_package_id": locked_package.id,
            "package_no": locked_package.package_no,
        },
    )
    record_timeline_event(
        actor,
        locked_package.project,
        primary_pile,
        EventType.CERTIFICATION_APPROVED,
        metadata,
    )
    record_audit_event(
        actor,
        locked_package.project,
        primary_pile,
        EventType.CERTIFICATION_APPROVED,
        metadata,
    )
    return locked_package


@transaction.atomic
def lock_package(package: CertificationPackage):
    locked_package = CertificationPackage.objects.select_for_update().get(pk=package.pk)
    ensure_package_transition_allowed(
        locked_package.current_state,
        CertificationPackageState.LOCKED,
    )
    locked_package.current_state = CertificationPackageState.LOCKED
    locked_package.locked_at = timezone.now()
    locked_package.save(
        update_fields=[
            "current_state",
            "locked_at",
            "updated_at",
        ]
    )
    return locked_package
