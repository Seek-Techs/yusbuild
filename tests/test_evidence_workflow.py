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
from apps.evidence.models import (
    EvidenceItem,
    EvidenceLink,
    EvidenceType,
    EvidenceVerificationStatus,
)
from apps.evidence.services.evidence_service import (
    link_evidence_to_version,
    soft_delete_evidence,
    upload_evidence,
)
from apps.execution.models import (
    DrivingResistanceLog,
    ExecutionRecord,
    ExecutionRecordType,
    PileDrivingRecord,
)
from apps.execution.services.submission_service import submit_execution_record
from apps.piles.models import Pile
from apps.projects.models import Project, ProjectMembership


@pytest.fixture
def evidence_media_root():
    path = Path.cwd() / "test_media" / uuid4().hex
    path.mkdir(parents=True, exist_ok=True)
    try:
        yield path
    finally:
        rmtree(path, ignore_errors=True)


@pytest.fixture
def evidence_user(db):
    user = get_user_model().objects.create_user(
        username="evidence-user",
        password="test-password",
    )
    engineer_group, _ = Group.objects.get_or_create(name="engineer")
    user.groups.add(engineer_group)
    return user


@pytest.fixture
def evidence_client(evidence_user):
    client = APIClient()
    client.force_authenticate(user=evidence_user)
    return client


@pytest.fixture
def evidence_project(db, evidence_user):
    project = Project.objects.create(
        name="Evidence Test Project",
        location="Lagos",
        client="BuildTech",
        status="ACTIVE",
        created_by="Engr. Yusuf",
    )
    ProjectMembership.objects.create(
        project=project,
        user=evidence_user,
        role=ProjectMembership.ROLE_ENGINEER,
    )
    return project


@pytest.fixture
def evidence_pile(evidence_project, type_ii_config):
    return Pile.objects.create(
        project=evidence_project,
        pile_no="EV-001",
        pile_type="TYPE_II",
        diameter_mm=500,
        design_length_m=20.0,
        actual_length_m=21.2,
        piling_method="Driven Cast In-Situ",
        concrete_grade="C35/40",
    )


@pytest.fixture
def submitted_evidence_version(evidence_project, evidence_pile, evidence_user):
    now = timezone.now()
    execution_record = ExecutionRecord.objects.create(
        project=evidence_project,
        pile=evidence_pile,
        record_type=ExecutionRecordType.PILE_DRIVING,
        contractor=evidence_user,
        created_by=evidence_user,
    )
    driving_record = PileDrivingRecord.objects.create(
        execution_record=execution_record,
        project=evidence_project,
        pile=evidence_pile,
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
    return submit_execution_record(execution_record, evidence_user)


def _upload(name="pile-photo.jpg", content=b"pile evidence bytes"):
    return SimpleUploadedFile(name, content, content_type="image/jpeg")


@pytest.mark.django_db
def test_evidence_upload_preserves_file_metadata(
    evidence_media_root,
    evidence_client,
    evidence_project,
):
    with override_settings(MEDIA_ROOT=evidence_media_root):
        response = evidence_client.post(
            "/api/v1/evidence/upload/",
            {
                "project": evidence_project.id,
                "file": _upload(),
                "captured_at": timezone.now().isoformat(),
                "gps_lat": "6.524379",
                "gps_lng": "3.379206",
                "evidence_type": EvidenceType.PHOTO,
            },
            format="multipart",
        )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    evidence = data["evidence"]
    assert data["warnings"] == []
    assert evidence["original_filename"] == "pile-photo.jpg"
    assert evidence["content_type"] == "image/jpeg"
    assert evidence["file_size"] == len(b"pile evidence bytes")
    assert evidence["sha256_hash"]
    assert evidence["verification_status"] == EvidenceVerificationStatus.PENDING


@pytest.mark.django_db
def test_hash_and_file_metadata_are_immutable(
    evidence_media_root,
    evidence_project,
    evidence_user,
):
    with override_settings(MEDIA_ROOT=evidence_media_root):
        evidence, _ = upload_evidence(
            {
                "project": evidence_project,
                "file": _upload(),
                "device_metadata": {},
                "evidence_type": EvidenceType.PHOTO,
            },
            evidence_user,
        )

    evidence.sha256_hash = "b" * 64
    with pytest.raises(ValidationError):
        evidence.save()

    evidence.refresh_from_db()
    evidence.original_filename = "changed.jpg"
    with pytest.raises(ValidationError):
        evidence.save()


@pytest.mark.django_db
def test_duplicate_hash_detection_returns_warning(
    evidence_media_root,
    evidence_client,
    evidence_project,
):
    with override_settings(MEDIA_ROOT=evidence_media_root):
        first = evidence_client.post(
            "/api/v1/evidence/upload/",
            {
                "project": evidence_project.id,
                "file": _upload("first.jpg", b"same bytes"),
                "evidence_type": EvidenceType.PHOTO,
            },
            format="multipart",
        )
        second = evidence_client.post(
            "/api/v1/evidence/upload/",
            {
                "project": evidence_project.id,
                "file": _upload("second.jpg", b"same bytes"),
                "evidence_type": EvidenceType.PHOTO,
            },
            format="multipart",
        )

    assert first.status_code == status.HTTP_201_CREATED
    assert second.status_code == status.HTTP_201_CREATED
    warnings = second.json()["warnings"]
    assert warnings == [
        {
            "code": "duplicate_sha256",
            "evidence_id": first.json()["evidence"]["id"],
            "sha256_hash": first.json()["evidence"]["sha256_hash"],
        }
    ]


@pytest.mark.django_db
def test_evidence_verification_workflow(
    evidence_media_root,
    evidence_client,
    evidence_project,
):
    with override_settings(MEDIA_ROOT=evidence_media_root):
        upload = evidence_client.post(
            "/api/v1/evidence/upload/",
            {
                "project": evidence_project.id,
                "file": _upload(),
                "evidence_type": EvidenceType.PHOTO,
            },
            format="multipart",
        )

    evidence_id = upload.json()["evidence"]["id"]
    response = evidence_client.post(
        f"/api/v1/evidence/{evidence_id}/verify/",
        {"verification_status": EvidenceVerificationStatus.VERIFIED},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["verification_status"] == EvidenceVerificationStatus.VERIFIED
    assert data["verified_by"]
    assert data["verified_at"]


@pytest.mark.django_db
def test_evidence_query_filters_by_project_pile_and_status(
    evidence_media_root,
    evidence_client,
    evidence_project,
    submitted_evidence_version,
):
    with override_settings(MEDIA_ROOT=evidence_media_root):
        upload = evidence_client.post(
            "/api/v1/evidence/upload/",
            {
                "project": evidence_project.id,
                "file": _upload(),
                "evidence_type": EvidenceType.PHOTO,
            },
            format="multipart",
        )
    evidence_id = upload.json()["evidence"]["id"]
    evidence_client.post(
        f"/api/v1/evidence/{evidence_id}/verify/",
        {"verification_status": EvidenceVerificationStatus.VERIFIED},
        format="json",
    )
    evidence_client.post(
        f"/api/v1/evidence/{evidence_id}/link/",
        {
            "execution_record_version": submitted_evidence_version.id,
            "is_primary": True,
        },
        format="json",
    )

    response = evidence_client.get(
        "/api/v1/evidence/",
        {
            "project": evidence_project.id,
            "pile": submitted_evidence_version.execution_record.pile_id,
            "evidence_type": EvidenceType.PHOTO,
            "verification_status": EvidenceVerificationStatus.VERIFIED,
        },
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["count"] == 1
    assert response.json()["results"][0]["id"] == evidence_id


@pytest.mark.django_db
def test_evidence_linked_to_approved_version_cannot_be_removed(
    evidence_media_root,
    evidence_project,
    evidence_user,
    submitted_evidence_version,
):
    with override_settings(MEDIA_ROOT=evidence_media_root):
        evidence, _ = upload_evidence(
            {
                "project": evidence_project,
                "file": _upload(),
                "device_metadata": {},
                "evidence_type": EvidenceType.PHOTO,
            },
            evidence_user,
        )
    link = link_evidence_to_version(
        evidence,
        submitted_evidence_version,
        evidence_user,
        is_primary=True,
    )
    approve_record_version(submitted_evidence_version, evidence_user)

    with pytest.raises(ValidationError):
        link.delete()

    with pytest.raises(ValueError):
        soft_delete_evidence(evidence)

    assert EvidenceLink.objects.filter(pk=link.pk).exists()
    evidence.refresh_from_db()
    assert evidence.is_deleted is False


@pytest.mark.django_db
def test_evidence_delete_is_soft_delete_only(
    evidence_media_root,
    evidence_project,
    evidence_user,
):
    with override_settings(MEDIA_ROOT=evidence_media_root):
        evidence, _ = upload_evidence(
            {
                "project": evidence_project,
                "file": _upload(),
                "device_metadata": {},
                "evidence_type": EvidenceType.PHOTO,
            },
            evidence_user,
        )

    evidence.delete()
    evidence.refresh_from_db()

    assert evidence.is_deleted is True
    assert EvidenceItem.objects.filter(pk=evidence.pk).exists()


@pytest.mark.django_db
def test_link_transaction_rolls_back_primary_replacement(
    evidence_media_root,
    evidence_project,
    evidence_user,
    submitted_evidence_version,
):
    with override_settings(MEDIA_ROOT=evidence_media_root):
        first_evidence, _ = upload_evidence(
            {
                "project": evidence_project,
                "file": _upload("first.jpg", b"first"),
                "device_metadata": {},
                "evidence_type": EvidenceType.PHOTO,
            },
            evidence_user,
        )
        second_evidence, _ = upload_evidence(
            {
                "project": evidence_project,
                "file": _upload("second.jpg", b"second"),
                "device_metadata": {},
                "evidence_type": EvidenceType.PHOTO,
            },
            evidence_user,
        )
    primary_link = link_evidence_to_version(
        first_evidence,
        submitted_evidence_version,
        evidence_user,
        is_primary=True,
    )

    with mock.patch.object(
        EvidenceLink.objects,
        "create",
        side_effect=IntegrityError("forced failure"),
    ):
        with pytest.raises(IntegrityError):
            link_evidence_to_version(
                second_evidence,
                submitted_evidence_version,
                evidence_user,
                is_primary=True,
            )

    primary_link.refresh_from_db()
    assert primary_link.is_primary is True
    assert EvidenceLink.objects.count() == 1
