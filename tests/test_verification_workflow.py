from datetime import timedelta
from pathlib import Path
from shutil import rmtree
from unittest import mock
from uuid import uuid4

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.approvals.services.approval_service import approve_record_version
from apps.evidence.models import EvidenceType
from apps.evidence.services.evidence_service import (
    link_evidence_to_version,
    upload_evidence,
)
from apps.execution.models import (
    DrivingResistanceLog,
    ExecutionRecord,
    ExecutionRecordState,
    ExecutionRecordType,
    PileDrivingRecord,
)
from apps.execution.services.submission_service import submit_execution_record
from apps.piles.calculations import PileCalculator
from apps.piles.models import Pile, PileCalculation
from apps.projects.models import Project, ProjectMembership
from apps.verification.models import (
    VarianceCategory,
    VarianceFlag,
    VarianceSeverity,
    VarianceStatus,
    VerificationActionLog,
)
from apps.verification.services import rule_engine
from apps.verification.services.verification_service import run_verification_checks


@pytest.fixture
def verification_media_root():
    path = Path.cwd() / "test_media" / uuid4().hex
    path.mkdir(parents=True, exist_ok=True)
    try:
        yield path
    finally:
        rmtree(path, ignore_errors=True)


@pytest.fixture
def verification_user(db):
    user = get_user_model().objects.create_user(
        username="verification-user",
        password="test-password",
    )
    engineer_group, _ = Group.objects.get_or_create(name="engineer")
    user.groups.add(engineer_group)
    return user


@pytest.fixture
def verification_client(verification_user):
    client = APIClient()
    client.force_authenticate(user=verification_user)
    return client


@pytest.fixture
def verification_project(db, verification_user):
    project = Project.objects.create(
        name="Verification Test Project",
        location="Lagos",
        client="BuildTech",
        status="ACTIVE",
        created_by="Engr. Yusuf",
    )
    ProjectMembership.objects.create(
        project=project,
        user=verification_user,
        role=ProjectMembership.ROLE_ENGINEER,
    )
    return project


@pytest.fixture
def verification_pile(verification_project, type_ii_config):
    return Pile.objects.create(
        project=verification_project,
        pile_no="VF-001",
        pile_type="TYPE_II",
        diameter_mm=500,
        design_length_m=20.0,
        actual_length_m=20.0,
        piling_method="Driven Cast In-Situ",
        concrete_grade="C35/40",
    )


def _create_version(
    project,
    pile,
    user,
    *,
    reported_depth=20.0,
    verified_depth=20.0,
    final_set="10mm/10 blows",
    logs=None,
):
    now = timezone.now()
    execution_record = ExecutionRecord.objects.create(
        project=project,
        pile=pile,
        record_type=ExecutionRecordType.PILE_DRIVING,
        contractor=user,
        created_by=user,
    )
    driving_record = PileDrivingRecord.objects.create(
        execution_record=execution_record,
        project=project,
        pile=pile,
        start_time=now,
        end_time=now + timedelta(hours=2),
        reported_depth_m=reported_depth,
        verified_depth_m=verified_depth,
        hammer_type="Diesel hammer",
        hammer_energy="45 kNm",
        final_set=final_set,
        total_blows=420,
        remarks="Driven to required set.",
        contractor_comments="No obstruction encountered.",
    )
    rows = logs or [
        {
            "sequence_no": 1,
            "depth_from_m": 0,
            "depth_to_m": 5,
            "penetration_mm": 5000,
            "blow_count": 80,
            "set_per_blow": 62.5,
            "notes": "Initial driving.",
        }
    ]
    for row in rows:
        DrivingResistanceLog.objects.create(driving_record=driving_record, **row)
    return submit_execution_record(execution_record, user)


def _upload(name="concrete-photo.jpg", content=b"evidence bytes"):
    return SimpleUploadedFile(name, content, content_type="image/jpeg")


@pytest.mark.django_db
def test_depth_variance_detection(
    verification_client,
    verification_project,
    verification_pile,
    verification_user,
):
    version = _create_version(
        verification_project,
        verification_pile,
        verification_user,
        reported_depth=18.5,
        verified_depth=18.5,
    )

    response = verification_client.post(
        f"/api/v1/verification/run-checks/{version.id}/",
    )

    assert response.status_code == status.HTTP_200_OK
    assert VarianceFlag.objects.filter(
        execution_record_version=version,
        rule_code="DEPTH_BELOW_DESIGN",
        category=VarianceCategory.DEPTH,
        severity=VarianceSeverity.CRITICAL,
    ).exists()


@pytest.mark.django_db
def test_concrete_tolerance_detection(
    verification_project,
    verification_pile,
    verification_user,
):
    version = _create_version(
        verification_project,
        verification_pile,
        verification_user,
        reported_depth=20.0,
        verified_depth=20.0,
    )
    concrete = PileCalculator.calculate_concrete(
        verification_pile.diameter_mm,
        verification_pile.design_length_m,
        verification_pile.actual_length_m,
    )
    PileCalculation.objects.create(
        pile=verification_pile,
        design_concrete_m3=concrete.design_volume_m3,
        actual_concrete_m3=concrete.actual_volume_m3 * 2,
    )

    run_verification_checks(version)

    assert VarianceFlag.objects.filter(
        execution_record_version=version,
        rule_code="CONCRETE_OUTSIDE_TOLERANCE",
    ).exists()


@pytest.mark.django_db
def test_duplicate_flag_prevention(
    verification_project,
    verification_pile,
    verification_user,
):
    version = _create_version(
        verification_project,
        verification_pile,
        verification_user,
        reported_depth=18.5,
        verified_depth=18.5,
    )

    run_verification_checks(version)
    run_verification_checks(version)

    assert (
        VarianceFlag.objects.filter(
            execution_record_version=version,
            rule_code="DEPTH_BELOW_DESIGN",
        ).count()
        == 1
    )


@pytest.mark.django_db
def test_rule_execution_is_idempotent(
    verification_project,
    verification_pile,
    verification_user,
):
    version = _create_version(
        verification_project,
        verification_pile,
        verification_user,
        reported_depth=18.5,
        verified_depth=18.5,
    )

    first = run_verification_checks(version)
    second = run_verification_checks(version)

    assert [flag.id for flag in first] == [flag.id for flag in second]
    assert VarianceFlag.objects.filter(execution_record_version=version).count() == len(
        first
    )


@pytest.mark.django_db
def test_missing_evidence_detection_for_approved_record(
    verification_project,
    verification_pile,
    verification_user,
):
    version = _create_version(
        verification_project,
        verification_pile,
        verification_user,
    )
    approve_record_version(version, verification_user)

    run_verification_checks(version)

    assert VarianceFlag.objects.filter(
        execution_record_version=version,
        rule_code="EVIDENCE_MISSING_FOR_APPROVED",
    ).exists()


@pytest.mark.django_db
def test_missing_approval_detection(
    verification_project,
    verification_pile,
    verification_user,
):
    version = _create_version(
        verification_project,
        verification_pile,
        verification_user,
    )
    record = version.execution_record
    record.current_state = ExecutionRecordState.APPROVED
    record.save(update_fields=["current_state"])

    run_verification_checks(version)

    assert VarianceFlag.objects.filter(
        execution_record_version=version,
        rule_code="APPROVAL_MISSING_DECISION",
    ).exists()


@pytest.mark.django_db
def test_duplicate_evidence_hash_detection(
    verification_media_root,
    verification_project,
    verification_pile,
    verification_user,
):
    version = _create_version(
        verification_project,
        verification_pile,
        verification_user,
    )
    with override_settings(MEDIA_ROOT=verification_media_root):
        first, _ = upload_evidence(
            {
                "project": verification_project,
                "file": _upload("first.jpg", b"same"),
                "device_metadata": {},
                "evidence_type": EvidenceType.PHOTO,
            },
            verification_user,
        )
        second, _ = upload_evidence(
            {
                "project": verification_project,
                "file": _upload("second.jpg", b"same"),
                "device_metadata": {},
                "evidence_type": EvidenceType.PHOTO,
            },
            verification_user,
        )
    link_evidence_to_version(first, version, verification_user)
    link_evidence_to_version(second, version, verification_user)

    run_verification_checks(version)

    assert VarianceFlag.objects.filter(
        execution_record_version=version,
        rule_code="EVIDENCE_DUPLICATE_HASH",
    ).exists()


@pytest.mark.django_db
def test_suspicious_blow_count_detection(
    verification_project,
    verification_pile,
    verification_user,
):
    repeated_logs = [
        {
            "sequence_no": 1,
            "depth_from_m": 0,
            "depth_to_m": 5,
            "penetration_mm": 5000,
            "blow_count": 80,
        },
        {
            "sequence_no": 2,
            "depth_from_m": 5,
            "depth_to_m": 10,
            "penetration_mm": 5000,
            "blow_count": 80,
        },
        {
            "sequence_no": 3,
            "depth_from_m": 10,
            "depth_to_m": 15,
            "penetration_mm": 5000,
            "blow_count": 80,
        },
    ]
    version = _create_version(
        verification_project,
        verification_pile,
        verification_user,
        final_set="",
        logs=repeated_logs,
    )

    run_verification_checks(version)

    assert VarianceFlag.objects.filter(
        execution_record_version=version,
        rule_code="BLOW_COUNT_MISSING_FINAL_SET",
    ).exists()
    assert VarianceFlag.objects.filter(
        execution_record_version=version,
        rule_code="BLOW_COUNT_REPEATED_VALUES",
    ).exists()


@pytest.mark.django_db
def test_resolve_and_waive_workflow(
    verification_client,
    verification_project,
    verification_pile,
    verification_user,
):
    version = _create_version(
        verification_project,
        verification_pile,
        verification_user,
        reported_depth=18.5,
        verified_depth=18.5,
    )
    run_verification_checks(version)
    flag = VarianceFlag.objects.get(rule_code="DEPTH_BELOW_DESIGN")

    resolve = verification_client.post(
        f"/api/v1/verification/flags/{flag.id}/resolve/",
        {"comment": "Survey correction accepted."},
        format="json",
    )

    assert resolve.status_code == status.HTTP_200_OK
    assert resolve.json()["status"] == VarianceStatus.RESOLVED
    assert resolve.json()["resolution_comment"] == "Survey correction accepted."

    second_flag = VarianceFlag.objects.exclude(pk=flag.pk).first()
    waive = verification_client.post(
        f"/api/v1/verification/flags/{second_flag.id}/waive/",
        {"comment": "Not applicable for this pilot."},
        format="json",
    )

    assert waive.status_code == status.HTTP_200_OK
    assert waive.json()["status"] == VarianceStatus.WAIVED
    assert VerificationActionLog.objects.count() == 2


@pytest.mark.django_db
def test_variance_flags_are_not_deletable(
    verification_project,
    verification_pile,
    verification_user,
):
    version = _create_version(
        verification_project,
        verification_pile,
        verification_user,
        reported_depth=18.5,
        verified_depth=18.5,
    )
    run_verification_checks(version)
    flag = VarianceFlag.objects.get(rule_code="DEPTH_BELOW_DESIGN")

    with pytest.raises(ValidationError):
        flag.delete()

    assert VarianceFlag.objects.filter(pk=flag.pk).exists()


@pytest.mark.django_db
def test_terminal_variance_status_cannot_transition(
    verification_client,
    verification_project,
    verification_pile,
    verification_user,
):
    version = _create_version(
        verification_project,
        verification_pile,
        verification_user,
        reported_depth=18.5,
        verified_depth=18.5,
    )
    run_verification_checks(version)
    flag = VarianceFlag.objects.get(rule_code="DEPTH_BELOW_DESIGN")

    resolved = verification_client.post(
        f"/api/v1/verification/flags/{flag.id}/resolve/",
        {"comment": "Resolved once."},
        format="json",
    )
    acknowledged = verification_client.post(
        f"/api/v1/verification/flags/{flag.id}/acknowledge/",
        {"comment": "Invalid after resolution."},
        format="json",
    )

    assert resolved.status_code == status.HTTP_200_OK
    assert acknowledged.status_code == status.HTTP_409_CONFLICT
    flag.refresh_from_db()
    assert flag.status == VarianceStatus.RESOLVED
    assert VerificationActionLog.objects.count() == 1


@pytest.mark.django_db
def test_verification_transaction_rolls_back_on_rule_failure(
    verification_project,
    verification_pile,
    verification_user,
):
    version = _create_version(
        verification_project,
        verification_pile,
        verification_user,
        reported_depth=18.5,
        verified_depth=18.5,
    )

    def failing_check(context):
        raise IntegrityError("forced failure")

    with mock.patch.object(
        rule_engine,
        "run_concrete_checks",
        side_effect=failing_check,
    ):
        with mock.patch(
            "apps.verification.services.verification_service.RULE_CHECKS",
            [rule_engine.run_depth_checks, rule_engine.run_concrete_checks],
        ):
            with pytest.raises(IntegrityError):
                run_verification_checks(version)

    assert VarianceFlag.objects.count() == 0
