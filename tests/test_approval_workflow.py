from copy import deepcopy
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

from apps.approvals.models import (
    ApprovalActionLog,
    ApprovalDecision,
    ApprovalDecisionType,
    ConsultantComment,
)
from apps.approvals.services.approval_service import (
    approve_record_version,
    reject_record_version,
    return_record_for_correction,
)
from apps.approvals.services.review_service import add_consultant_comment
from apps.execution.models import (
    DrivingResistanceLog,
    ExecutionRecord,
    ExecutionRecordState,
    ExecutionRecordType,
    PileDrivingRecord,
)
from apps.execution.services.state_machine import InvalidExecutionTransition
from apps.execution.services.submission_service import submit_execution_record
from apps.piles.models import Pile
from apps.projects.models import Project, ProjectMembership


@pytest.fixture
def approval_user(db):
    user = get_user_model().objects.create_user(
        username="approval-consultant",
        password="test-password",
    )
    engineer_group, _ = Group.objects.get_or_create(name="engineer")
    user.groups.add(engineer_group)
    return user


@pytest.fixture
def approval_client(approval_user):
    client = APIClient()
    client.force_authenticate(user=approval_user)
    return client


@pytest.fixture
def approval_project(db, approval_user):
    project = Project.objects.create(
        name="Approval Test Project",
        location="Lagos",
        client="BuildTech",
        status="ACTIVE",
        created_by="Engr. Yusuf",
    )
    ProjectMembership.objects.create(
        project=project,
        user=approval_user,
        role=ProjectMembership.ROLE_ENGINEER,
    )
    return project


@pytest.fixture
def approval_pile(approval_project, type_ii_config):
    return Pile.objects.create(
        project=approval_project,
        pile_no="AP-001",
        pile_type="TYPE_II",
        diameter_mm=500,
        design_length_m=20.0,
        actual_length_m=21.2,
        piling_method="Driven Cast In-Situ",
        concrete_grade="C35/40",
    )


@pytest.fixture
def submitted_version(approval_project, approval_pile, approval_user):
    now = timezone.now()
    execution_record = ExecutionRecord.objects.create(
        project=approval_project,
        pile=approval_pile,
        record_type=ExecutionRecordType.PILE_DRIVING,
        contractor=approval_user,
        created_by=approval_user,
    )
    driving_record = PileDrivingRecord.objects.create(
        execution_record=execution_record,
        project=approval_project,
        pile=approval_pile,
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
    return submit_execution_record(execution_record, approval_user)


@pytest.mark.django_db
def test_approve_submitted_version(approval_client, submitted_version):
    response = approval_client.post(
        "/api/v1/approvals/approve/",
        {
            "execution_record_version": submitted_version.id,
            "comments": "Verified against site record.",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["decision"] == ApprovalDecisionType.APPROVE
    assert data["previous_state"] == ExecutionRecordState.UNDER_REVIEW
    assert data["new_state"] == ExecutionRecordState.APPROVED

    submitted_version.execution_record.refresh_from_db()
    assert (
        submitted_version.execution_record.current_state
        == ExecutionRecordState.APPROVED
    )
    assert ApprovalDecision.objects.count() == 1
    assert (
        ApprovalActionLog.objects.filter(
            action=ApprovalDecisionType.APPROVE,
        ).count()
        == 1
    )


@pytest.mark.django_db
def test_reject_submitted_version(approval_user, submitted_version):
    decision = reject_record_version(
        submitted_version,
        approval_user,
        comments="Depth evidence does not match.",
    )

    assert decision.decision == ApprovalDecisionType.REJECT
    assert decision.new_state == ExecutionRecordState.REJECTED
    submitted_version.execution_record.refresh_from_db()
    assert (
        submitted_version.execution_record.current_state
        == ExecutionRecordState.REJECTED
    )
    assert ApprovalActionLog.objects.filter(action=ApprovalDecisionType.REJECT).exists()


@pytest.mark.django_db
def test_return_for_correction_submitted_version(approval_user, submitted_version):
    decision = return_record_for_correction(
        submitted_version,
        approval_user,
        comments="Correct final set notes.",
    )

    assert decision.decision == ApprovalDecisionType.RETURN_FOR_CORRECTION
    assert decision.new_state == ExecutionRecordState.RETURNED_FOR_CORRECTION
    submitted_version.execution_record.refresh_from_db()
    assert (
        submitted_version.execution_record.current_state
        == ExecutionRecordState.RETURNED_FOR_CORRECTION
    )


@pytest.mark.django_db
def test_invalid_approval_transitions_are_blocked(approval_user, submitted_version):
    approve_record_version(submitted_version, approval_user)

    with pytest.raises(InvalidExecutionTransition):
        reject_record_version(submitted_version, approval_user)

    assert ApprovalDecision.objects.count() == 1
    assert ApprovalActionLog.objects.count() == 1


@pytest.mark.django_db
def test_approval_logs_are_append_only(approval_user, submitted_version):
    decision = approve_record_version(submitted_version, approval_user)
    comment = add_consultant_comment(
        submitted_version,
        approval_user,
        "Approval note retained separately.",
    )

    assert ApprovalDecision.objects.count() == 1
    assert ConsultantComment.objects.count() == 1
    assert ApprovalActionLog.objects.count() == 2

    log = ApprovalActionLog.objects.get(action=ApprovalDecisionType.APPROVE)
    log.metadata = {"changed": True}
    with pytest.raises(ValidationError):
        log.save()

    decision.comments = "Changed"
    with pytest.raises(ValidationError):
        decision.save()

    comment.comment = "Changed"
    with pytest.raises(ValidationError):
        comment.save()


@pytest.mark.django_db
def test_submitted_snapshot_is_immutable_after_approval(
    approval_user,
    submitted_version,
):
    snapshot_before = deepcopy(submitted_version.data_snapshot)
    approve_record_version(submitted_version, approval_user)

    submitted_version.data_snapshot["pile_driving_record"]["total_blows"] = 999
    with pytest.raises(ValidationError):
        submitted_version.save()

    submitted_version.refresh_from_db()
    assert submitted_version.data_snapshot == snapshot_before


@pytest.mark.django_db
def test_approval_transaction_rolls_back_when_decision_creation_fails(
    approval_user,
    submitted_version,
):
    with mock.patch.object(
        ApprovalDecision.objects,
        "create",
        side_effect=IntegrityError("forced failure"),
    ):
        with pytest.raises(IntegrityError):
            approve_record_version(submitted_version, approval_user)

    submitted_version.execution_record.refresh_from_db()
    assert (
        submitted_version.execution_record.current_state
        == ExecutionRecordState.SUBMITTED
    )
    assert ApprovalDecision.objects.count() == 0
    assert ApprovalActionLog.objects.count() == 0
