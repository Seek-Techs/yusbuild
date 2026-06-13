from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.approvals.services.approval_service import (
    return_record_for_correction as approve_return_for_correction,
)
from apps.execution.models import (
    ExecutionRecordState,
    ExecutionRecordVersion,
    PileDrivingRecord,
)
from apps.execution.services.revision_service import (
    create_revision_from_record,
    return_record_for_correction,
)
from apps.execution.services.state_machine import InvalidExecutionTransition
from apps.execution.services.submission_service import submit_execution_record
from apps.piles.models import Pile
from apps.projects.models import Project, ProjectMembership


@pytest.fixture
def execution_user(db):
    user = get_user_model().objects.create_user(
        username="execution-user",
        password="test-password",
    )
    engineer_group, _ = Group.objects.get_or_create(name="engineer")
    user.groups.add(engineer_group)
    return user


@pytest.fixture
def execution_client(execution_user):
    client = APIClient()
    client.force_authenticate(user=execution_user)
    return client


@pytest.fixture
def execution_project(db, execution_user):
    project = Project.objects.create(
        name="Phase 5A Test Project",
        location="Lagos",
        client="BuildTech",
        status="ACTIVE",
        created_by="Engr. Yusuf",
    )
    ProjectMembership.objects.create(
        project=project,
        user=execution_user,
        role=ProjectMembership.ROLE_ENGINEER,
    )
    return project


@pytest.fixture
def execution_pile(execution_project, type_ii_config):
    return Pile.objects.create(
        project=execution_project,
        pile_no="DP-001",
        pile_type="TYPE_II",
        diameter_mm=500,
        design_length_m=20.0,
        actual_length_m=21.2,
        piling_method="Driven Cast In-Situ",
        concrete_grade="C35/40",
    )


@pytest.fixture
def driving_payload(execution_project, execution_pile):
    now = timezone.now()
    return {
        "project": execution_project.id,
        "pile": execution_pile.id,
        "start_time": now.isoformat(),
        "end_time": (now + timedelta(hours=2)).isoformat(),
        "reported_depth_m": 21.2,
        "verified_depth_m": 21.2,
        "hammer_type": "Diesel hammer",
        "hammer_energy": "45 kNm",
        "final_set": "10mm/10 blows",
        "total_blows": 420,
        "remarks": "Driven to required set.",
        "contractor_comments": "No obstruction encountered.",
        "resistance_logs": [
            {
                "sequence_no": 1,
                "depth_from_m": 0,
                "depth_to_m": 5,
                "penetration_mm": 5000,
                "blow_count": 80,
                "set_per_blow": 62.5,
                "notes": "Initial driving.",
            },
            {
                "sequence_no": 2,
                "depth_from_m": 5,
                "depth_to_m": 10,
                "penetration_mm": 5000,
                "blow_count": 120,
                "set_per_blow": 41.67,
                "notes": "Resistance increasing.",
            },
        ],
    }


@pytest.fixture
def draft_driving_record(execution_client, driving_payload):
    response = execution_client.post(
        "/api/v1/execution/driving-records/",
        driving_payload,
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED
    return PileDrivingRecord.objects.get(pk=response.json()["id"])


@pytest.mark.django_db
def test_draft_creation(execution_client, driving_payload):
    response = execution_client.post(
        "/api/v1/execution/driving-records/",
        driving_payload,
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["current_state"] == ExecutionRecordState.DRAFT
    assert data["current_version_no"] == 0
    assert len(data["resistance_logs"]) == 2

    driving_record = PileDrivingRecord.objects.get(pk=data["id"])
    assert driving_record.execution_record.project_id == driving_payload["project"]
    assert driving_record.execution_record.pile_id == driving_payload["pile"]


@pytest.mark.django_db
def test_successful_submission_creates_immutable_version(
    execution_client,
    draft_driving_record,
):
    response = execution_client.post(
        f"/api/v1/execution/driving-records/{draft_driving_record.id}/submit/",
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["current_state"] == ExecutionRecordState.SUBMITTED
    assert data["current_version_no"] == 1
    assert data["latest_version"]["version_no"] == 1
    assert data["latest_version"]["source_record_hash"]

    version = ExecutionRecordVersion.objects.get(
        execution_record=draft_driving_record.execution_record,
        version_no=1,
    )
    assert version.data_snapshot["pile_driving_record"]["total_blows"] == 420
    assert len(version.data_snapshot["driving_resistance_logs"]) == 2


@pytest.mark.django_db
def test_submitted_records_are_immutable(execution_client, draft_driving_record):
    execution_client.post(
        f"/api/v1/execution/driving-records/{draft_driving_record.id}/submit/",
    )

    response = execution_client.patch(
        f"/api/v1/execution/driving-records/{draft_driving_record.id}/",
        {"total_blows": 999},
        format="json",
    )

    assert response.status_code == status.HTTP_409_CONFLICT
    draft_driving_record.refresh_from_db()
    assert draft_driving_record.total_blows == 420

    draft_driving_record.total_blows = 999
    with pytest.raises(ValidationError):
        draft_driving_record.save()


@pytest.mark.django_db
def test_revision_creates_new_version_without_mutating_history(
    execution_user,
    draft_driving_record,
):
    first_version = submit_execution_record(
        draft_driving_record.execution_record,
        execution_user,
    )
    approve_return_for_correction(first_version, execution_user)

    second_version = create_revision_from_record(
        draft_driving_record.execution_record,
        execution_user,
        revision_data={
            "total_blows": 450,
            "contractor_comments": "Corrected after consultant comment.",
        },
    )

    assert second_version.version_no == 2
    assert second_version.supersedes_version == first_version
    assert first_version.data_snapshot["pile_driving_record"]["total_blows"] == 420
    assert second_version.data_snapshot["pile_driving_record"]["total_blows"] == 450

    draft_driving_record.execution_record.refresh_from_db()
    assert (
        draft_driving_record.execution_record.current_state
        == ExecutionRecordState.SUBMITTED
    )
    assert draft_driving_record.execution_record.current_version_no == 2


@pytest.mark.django_db
def test_state_transitions_and_invalid_transitions_blocked(
    execution_user,
    draft_driving_record,
):
    with pytest.raises(InvalidExecutionTransition):
        return_record_for_correction(draft_driving_record.execution_record)

    first_version = submit_execution_record(
        draft_driving_record.execution_record,
        execution_user,
    )
    decision = approve_return_for_correction(first_version, execution_user)
    assert decision.new_state == ExecutionRecordState.RETURNED_FOR_CORRECTION
    draft_driving_record.execution_record.refresh_from_db()
    assert (
        draft_driving_record.execution_record.current_state
        == ExecutionRecordState.RETURNED_FOR_CORRECTION
    )

    with pytest.raises(InvalidExecutionTransition):
        approve_return_for_correction(first_version, execution_user)


@pytest.mark.django_db
def test_invalid_api_transition_is_blocked(execution_client, draft_driving_record):
    first = execution_client.post(
        f"/api/v1/execution/driving-records/{draft_driving_record.id}/submit/",
    )
    second = execution_client.post(
        f"/api/v1/execution/driving-records/{draft_driving_record.id}/submit/",
    )

    assert first.status_code == status.HTTP_200_OK
    assert second.status_code == status.HTTP_409_CONFLICT
    assert ExecutionRecordVersion.objects.count() == 1


@pytest.mark.django_db
def test_transaction_rollback_when_version_creation_fails(
    execution_user,
    draft_driving_record,
):
    execution_record = draft_driving_record.execution_record
    ExecutionRecordVersion.objects.create(
        execution_record=execution_record,
        version_no=1,
        submitted_by=execution_user,
        data_snapshot={"preexisting": True},
        source_record_hash="a" * 64,
    )

    with pytest.raises(IntegrityError), transaction.atomic():
        submit_execution_record(execution_record, execution_user)

    execution_record.refresh_from_db()
    assert execution_record.current_state == ExecutionRecordState.DRAFT
    assert execution_record.current_version_no == 0
    assert execution_record.latest_version is None
