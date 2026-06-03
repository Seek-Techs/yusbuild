from datetime import timedelta
from unittest import mock

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.approvals.services.approval_service import approve_record_version
from apps.audit.models import AuditEvent, EventType, TimelineEvent
from apps.certification.models import (
    CertificationLine,
    CertificationPackage,
    CertificationPackageState,
    CertifiedQuantity,
)
from apps.certification.services.certification_service import (
    add_certification_line,
    certify_package,
)
from apps.certification.services.package_service import (
    InvalidCertificationTransition,
    approve_package,
    lock_package,
    submit_package,
)
from apps.execution.models import (
    DrivingResistanceLog,
    ExecutionRecord,
    ExecutionRecordState,
    ExecutionRecordType,
    PileDrivingRecord,
)
from apps.execution.services.submission_service import submit_execution_record
from apps.piles.models import Pile
from apps.projects.models import Project, ProjectMembership


@pytest.fixture
def certification_user(db):
    user = get_user_model().objects.create_user(
        username="certification-user",
        password="test-password",
    )
    engineer_group, _ = Group.objects.get_or_create(name="engineer")
    user.groups.add(engineer_group)
    return user


@pytest.fixture
def certification_client(certification_user):
    client = APIClient()
    client.force_authenticate(user=certification_user)
    return client


@pytest.fixture
def certification_project(db, certification_user):
    project = Project.objects.create(
        name="Certification Test Project",
        location="Lagos",
        client="BuildTech",
        status="ACTIVE",
        created_by="Engr. Yusuf",
    )
    ProjectMembership.objects.create(
        project=project,
        user=certification_user,
        role=ProjectMembership.ROLE_ENGINEER,
    )
    return project


@pytest.fixture
def certification_pile(certification_project, type_ii_config):
    return Pile.objects.create(
        project=certification_project,
        pile_no="CERT-001",
        pile_type="TYPE_II",
        diameter_mm=500,
        design_length_m=20.0,
        actual_length_m=21.2,
        piling_method="Driven Cast In-Situ",
        concrete_grade="C35/40",
    )


@pytest.fixture
def submitted_certification_version(
    certification_project,
    certification_pile,
    certification_user,
):
    now = timezone.now()
    execution_record = ExecutionRecord.objects.create(
        project=certification_project,
        pile=certification_pile,
        record_type=ExecutionRecordType.PILE_DRIVING,
        contractor=certification_user,
        created_by=certification_user,
    )
    driving_record = PileDrivingRecord.objects.create(
        execution_record=execution_record,
        project=certification_project,
        pile=certification_pile,
        start_time=now,
        end_time=now + timedelta(hours=2),
        reported_depth_m=21.2,
        verified_depth_m=21.2,
        hammer_type="Diesel hammer",
        hammer_energy="45 kNm",
        final_set="10mm/10 blows",
        total_blows=420,
        remarks="Driven to required set.",
        contractor_comments="No obstruction encountered.",
    )
    DrivingResistanceLog.objects.create(
        driving_record=driving_record,
        sequence_no=1,
        depth_from_m=0,
        depth_to_m=5,
        penetration_mm=5000,
        blow_count=80,
        set_per_blow=62.5,
        notes="Initial driving.",
    )
    return submit_execution_record(execution_record, certification_user)


@pytest.fixture
def approved_certification_version(
    submitted_certification_version,
    certification_user,
):
    approve_record_version(submitted_certification_version, certification_user)
    submitted_certification_version.refresh_from_db()
    return submitted_certification_version


@pytest.fixture
def draft_certification_package(certification_project, certification_user):
    return CertificationPackage.objects.create(
        project=certification_project,
        package_no="CERT-PKG-001",
        description="First pile certification package.",
        created_by=certification_user,
    )


def line_payload(pile, version):
    return {
        "pile": pile.id,
        "source_execution_version": version.id,
        "certified_depth_m": 21.2,
        "certified_concrete_m3": 4.163,
        "certified_reinforcement_kg": 662.46,
    }


@pytest.mark.django_db
def test_certification_package_creation_api(
    certification_client,
    certification_project,
):
    response = certification_client.post(
        "/api/v1/certification/packages/",
        {
            "project": certification_project.id,
            "package_no": "CERT-PKG-API",
            "description": "API-created package.",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["current_state"] == CertificationPackageState.DRAFT
    assert data["quantity_snapshot"] == {}


@pytest.mark.django_db
def test_draft_package_update_and_non_draft_update_blocked(
    certification_client,
    certification_project,
    certification_user,
    draft_certification_package,
):
    response = certification_client.patch(
        f"/api/v1/certification/packages/{draft_certification_package.id}/",
        {"description": "Updated draft description."},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["description"] == "Updated draft description."

    CertificationLine.objects.create(
        package=draft_certification_package,
        pile=Pile.objects.create(
            project=certification_project,
            pile_no="CERT-UPD-001",
            pile_type="TYPE_II",
            diameter_mm=500,
            design_length_m=20.0,
            actual_length_m=21.2,
        ),
        source_execution_version=ExecutionRecord.objects.create(
            project=certification_project,
            pile=Pile.objects.create(
                project=certification_project,
                pile_no="CERT-UPD-002",
                pile_type="TYPE_II",
                diameter_mm=500,
                design_length_m=20.0,
                actual_length_m=21.2,
            ),
        ).versions.create(
            version_no=1,
            data_snapshot={},
            source_record_hash="b" * 64,
        ),
        certified_depth_m=1,
        certified_concrete_m3=1,
        certified_reinforcement_kg=1,
    )
    submit_package(draft_certification_package, certification_user)

    conflict = certification_client.patch(
        f"/api/v1/certification/packages/{draft_certification_package.id}/",
        {"description": "Should not change."},
        format="json",
    )

    assert conflict.status_code == status.HTTP_409_CONFLICT
    assert conflict.json()["detail"] == (
        "Only draft certification packages can be updated."
    )


@pytest.mark.django_db
def test_certification_line_requires_approved_execution_version(
    certification_client,
    certification_pile,
    submitted_certification_version,
    draft_certification_package,
):
    response = certification_client.post(
        (f"/api/v1/certification/packages/{draft_certification_package.id}/add-line/"),
        line_payload(certification_pile, submitted_certification_version),
        format="json",
    )

    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json()["detail"] == (
        "Certification can only consume approved execution versions."
    )
    assert CertificationLine.objects.count() == 0


@pytest.mark.django_db
def test_add_certification_line_from_approved_version(
    certification_client,
    certification_pile,
    approved_certification_version,
    draft_certification_package,
):
    response = certification_client.post(
        (f"/api/v1/certification/packages/{draft_certification_package.id}/add-line/"),
        line_payload(certification_pile, approved_certification_version),
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["pile"] == certification_pile.id
    assert data["source_execution_version"] == approved_certification_version.id
    assert data["quantity_snapshot"]["source_record_hash"]
    assert data["certified_quantity"] is None


@pytest.mark.django_db
def test_certification_line_rejects_cross_project_and_pile_mismatch(
    certification_project,
    certification_user,
    approved_certification_version,
    draft_certification_package,
    type_ii_config,
):
    wrong_pile = Pile.objects.create(
        project=certification_project,
        pile_no="CERT-WRONG-PILE",
        pile_type="TYPE_II",
        diameter_mm=500,
        design_length_m=20.0,
        actual_length_m=21.2,
    )
    with pytest.raises(ValueError, match="Pile must match"):
        add_certification_line(
            draft_certification_package,
            {
                "pile": wrong_pile,
                "source_execution_version": approved_certification_version,
                "certified_depth_m": 21.2,
                "certified_concrete_m3": 4.163,
                "certified_reinforcement_kg": 662.46,
            },
        )

    other_project = Project.objects.create(
        name="Other Certification Project",
        status="ACTIVE",
        created_by="Engr. Yusuf",
    )
    other_package = CertificationPackage.objects.create(
        project=other_project,
        package_no="OTHER-CERT-PKG",
        created_by=certification_user,
    )
    with pytest.raises(ValueError, match="package project"):
        add_certification_line(
            other_package,
            {
                "pile": approved_certification_version.execution_record.pile,
                "source_execution_version": approved_certification_version,
                "certified_depth_m": 21.2,
                "certified_concrete_m3": 4.163,
                "certified_reinforcement_kg": 662.46,
            },
        )


@pytest.mark.django_db
def test_package_lifecycle_to_certified_freezes_quantities(
    certification_client,
    certification_pile,
    approved_certification_version,
    draft_certification_package,
):
    add_certification_line(
        draft_certification_package,
        {
            "pile": certification_pile,
            "source_execution_version": approved_certification_version,
            "certified_depth_m": 21.2,
            "certified_concrete_m3": 4.163,
            "certified_reinforcement_kg": 662.46,
        },
    )

    for action, expected_state in [
        ("submit", CertificationPackageState.SUBMITTED),
        ("approve", CertificationPackageState.APPROVED),
        ("certify", CertificationPackageState.CERTIFIED),
    ]:
        response = certification_client.post(
            
                "/api/v1/certification/packages/"
                f"{draft_certification_package.id}/{action}/"
            
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["current_state"] == expected_state

    draft_certification_package.refresh_from_db()
    assert draft_certification_package.quantity_snapshot["line_count"] == 1
    assert draft_certification_package.quantity_snapshot["totals"] == {
        "certified_depth_m": 21.2,
        "certified_concrete_m3": 4.163,
        "certified_reinforcement_kg": 662.46,
    }
    assert CertifiedQuantity.objects.count() == 1
    approved_certification_version.execution_record.refresh_from_db()
    assert (
        approved_certification_version.execution_record.current_state
        == ExecutionRecordState.CERTIFIED
    )


@pytest.mark.django_db
def test_certification_package_transitions_record_audit_and_timeline_events(
    certification_user,
    certification_project,
    certification_pile,
    approved_certification_version,
    draft_certification_package,
):
    add_certification_line(
        draft_certification_package,
        {
            "pile": certification_pile,
            "source_execution_version": approved_certification_version,
            "certified_depth_m": 21.2,
            "certified_concrete_m3": 4.163,
            "certified_reinforcement_kg": 662.46,
        },
    )
    submit_package(draft_certification_package, certification_user)
    approve_package(draft_certification_package, certification_user)
    certify_package(draft_certification_package, certification_user)

    certification_timeline = TimelineEvent.objects.filter(
        project=certification_project,
        event_type__in=[
            EventType.CERTIFICATION_SUBMITTED,
            EventType.CERTIFICATION_APPROVED,
            EventType.CERTIFICATION_CERTIFIED,
        ],
    )
    certification_audit = AuditEvent.objects.filter(
        project=certification_project,
        event_type__in=[
            EventType.CERTIFICATION_SUBMITTED,
            EventType.CERTIFICATION_APPROVED,
            EventType.CERTIFICATION_CERTIFIED,
        ],
    )

    assert certification_timeline.count() == 3
    assert certification_audit.count() == 3
    assert set(certification_timeline.values_list("event_type", flat=True)) == {
        EventType.CERTIFICATION_SUBMITTED,
        EventType.CERTIFICATION_APPROVED,
        EventType.CERTIFICATION_CERTIFIED,
    }
    assert set(certification_audit.values_list("event_type", flat=True)) == {
        EventType.CERTIFICATION_SUBMITTED,
        EventType.CERTIFICATION_APPROVED,
        EventType.CERTIFICATION_CERTIFIED,
    }


@pytest.mark.django_db
def test_certified_package_can_be_locked(
    certification_client,
    certification_user,
    certification_pile,
    approved_certification_version,
    draft_certification_package,
):
    add_certification_line(
        draft_certification_package,
        {
            "pile": certification_pile,
            "source_execution_version": approved_certification_version,
            "certified_depth_m": 21.2,
            "certified_concrete_m3": 4.163,
            "certified_reinforcement_kg": 662.46,
        },
    )
    submit_package(draft_certification_package, certification_user)
    approve_package(draft_certification_package, certification_user)
    certify_package(draft_certification_package, certification_user)

    response = certification_client.post(
        f"/api/v1/certification/packages/{draft_certification_package.id}/lock/"
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["current_state"] == CertificationPackageState.LOCKED
    draft_certification_package.refresh_from_db()
    assert draft_certification_package.locked_at is not None

    with pytest.raises(InvalidCertificationTransition):
        lock_package(draft_certification_package)


@pytest.mark.django_db
def test_certified_quantities_are_immutable(
    certification_user,
    certification_pile,
    approved_certification_version,
    draft_certification_package,
):
    add_certification_line(
        draft_certification_package,
        {
            "pile": certification_pile,
            "source_execution_version": approved_certification_version,
            "certified_depth_m": 21.2,
            "certified_concrete_m3": 4.163,
            "certified_reinforcement_kg": 662.46,
        },
    )
    submit_package(draft_certification_package, certification_user)
    approve_package(draft_certification_package, certification_user)
    certify_package(draft_certification_package, certification_user)

    quantity = CertifiedQuantity.objects.get()
    quantity.certified_depth_m = 99
    with pytest.raises(ValidationError):
        quantity.save()

    with pytest.raises(ValidationError):
        quantity.delete()

    line = CertificationLine.objects.get()
    line.certified_depth_m = 99
    with pytest.raises(ValidationError):
        line.save()


@pytest.mark.django_db
def test_invalid_package_transitions_are_blocked(
    certification_user,
    draft_certification_package,
):
    with pytest.raises(InvalidCertificationTransition):
        approve_package(draft_certification_package, certification_user)

    with pytest.raises(ValueError):
        submit_package(draft_certification_package, certification_user)


@pytest.mark.django_db
def test_certification_rollback_when_quantity_freeze_fails(
    certification_user,
    certification_pile,
    approved_certification_version,
    draft_certification_package,
):
    add_certification_line(
        draft_certification_package,
        {
            "pile": certification_pile,
            "source_execution_version": approved_certification_version,
            "certified_depth_m": 21.2,
            "certified_concrete_m3": 4.163,
            "certified_reinforcement_kg": 662.46,
        },
    )
    submit_package(draft_certification_package, certification_user)
    approve_package(draft_certification_package, certification_user)

    with mock.patch.object(
        CertifiedQuantity.objects,
        "bulk_create",
        side_effect=IntegrityError("forced freeze failure"),
    ):
        with pytest.raises(IntegrityError):
            certify_package(draft_certification_package, certification_user)

    draft_certification_package.refresh_from_db()
    approved_certification_version.execution_record.refresh_from_db()
    assert (
        draft_certification_package.current_state == CertificationPackageState.APPROVED
    )
    assert draft_certification_package.quantity_snapshot == {}
    assert CertifiedQuantity.objects.count() == 0
    assert (
        approved_certification_version.execution_record.current_state
        == ExecutionRecordState.APPROVED
    )


@pytest.mark.django_db
def test_api_returns_deterministic_conflict_for_invalid_transition(
    certification_client,
    draft_certification_package,
):
    response = certification_client.post(
        f"/api/v1/certification/packages/{draft_certification_package.id}/approve/"
    )

    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json() == {
        "detail": "Cannot transition certification package from DRAFT to APPROVED."
    }
