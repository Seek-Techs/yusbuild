import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.audit.models import EventType
from apps.audit.services.audit_service import record_audit_event
from apps.audit.services.timeline_service import (
    get_pile_timeline,
    get_project_timeline,
    list_timeline_events,
    record_timeline_event,
)
from apps.piles.models import Pile
from apps.projects.models import Project, ProjectMembership


@pytest.fixture
def audit_user(db):
    user = get_user_model().objects.create_user(
        username="audit-user",
        password="test-password",
    )
    user.is_staff = True
    user.is_superuser = True
    user.save()
    return user


@pytest.fixture
def audit_project(db, audit_user):
    project = Project.objects.create(
        name="Audit Test Project",
        location="Lagos",
        client="BuildTech",
        status="ACTIVE",
        created_by="Audit Bot",
    )
    ProjectMembership.objects.create(
        project=project,
        user=audit_user,
        role=ProjectMembership.ROLE_ENGINEER,
    )
    return project


@pytest.fixture
def audit_pile(audit_project):
    return Pile.objects.create(
        project=audit_project,
        pile_no="AUDIT-001",
        pile_type="TYPE_II",
        diameter_mm=500,
        design_length_m=20.0,
        actual_length_m=21.2,
        piling_method="Driven Cast In-Situ",
        concrete_grade="C35/40",
    )


@pytest.mark.django_db
def test_append_only_events_are_immutable(audit_user, audit_project, audit_pile):
    audit_event = record_audit_event(
        audit_user,
        audit_project,
        audit_pile,
        EventType.EVIDENCE_LINKED,
        {"detail": "audit created"},
    )
    timeline_event = record_timeline_event(
        audit_user,
        audit_project,
        audit_pile,
        EventType.EVIDENCE_VERIFIED,
        {"detail": "timeline created"},
    )

    audit_event.metadata = {"detail": "modified"}
    with pytest.raises(ValidationError):
        audit_event.save()

    with pytest.raises(ValidationError):
        audit_event.delete()

    timeline_event.metadata = {"detail": "modified"}
    with pytest.raises(ValidationError):
        timeline_event.save()

    with pytest.raises(ValidationError):
        timeline_event.delete()


@pytest.mark.django_db
def test_timeline_query_helpers_filter_by_project_and_pile(
    audit_user,
    audit_project,
):
    pile_1 = Pile.objects.create(
        project=audit_project,
        pile_no="AUDIT-PILE-1",
        pile_type="TYPE_II",
        diameter_mm=600,
        design_length_m=22.0,
        actual_length_m=22.0,
        piling_method="Driven Cast In-Situ",
        concrete_grade="C35/40",
    )
    pile_2 = Pile.objects.create(
        project=audit_project,
        pile_no="AUDIT-PILE-2",
        pile_type="TYPE_III",
        diameter_mm=700,
        design_length_m=24.0,
        actual_length_m=24.0,
        piling_method="Driven Cast In-Situ",
        concrete_grade="C35/40",
    )
    other_project = Project.objects.create(
        name="Other Audit Project",
        location="Abuja",
        client="BuildTech",
        status="ACTIVE",
        created_by="Audit Bot",
    )
    other_pile = Pile.objects.create(
        project=other_project,
        pile_no="AUDIT-OTHER-1",
        pile_type="TYPE_II",
        diameter_mm=500,
        design_length_m=20.0,
        actual_length_m=20.0,
        piling_method="Driven Cast In-Situ",
        concrete_grade="C35/40",
    )

    record_timeline_event(
        audit_user,
        audit_project,
        pile_1,
        EventType.EVIDENCE_LINKED,
        {},
    )
    record_timeline_event(
        audit_user,
        audit_project,
        pile_2,
        EventType.EVIDENCE_VERIFIED,
        {},
    )
    record_timeline_event(
        audit_user,
        other_project,
        other_pile,
        EventType.VERIFICATION_RUN,
        {},
    )

    project_events = list(get_project_timeline(audit_project.id))
    assert len(project_events) == 2
    assert {event.event_type for event in project_events} == {
        EventType.EVIDENCE_LINKED,
        EventType.EVIDENCE_VERIFIED,
    }

    pile_events = list(get_pile_timeline(pile_2.id))
    assert len(pile_events) == 1
    assert pile_events[0].event_type == EventType.EVIDENCE_VERIFIED

    filtered_events = list(
        list_timeline_events(project_id=audit_project.id, pile_id=pile_1.id)
    )
    assert len(filtered_events) == 1
    assert filtered_events[0].pile_id == pile_1.id


@pytest.mark.django_db
def test_timeline_api_endpoints_return_project_and_pile_events(
    audit_user,
    audit_project,
    audit_pile,
):
    client = APIClient()
    client.force_authenticate(user=audit_user)

    record_timeline_event(
        audit_user,
        audit_project,
        audit_pile,
        EventType.EVIDENCE_LINKED,
        {"audit": "one"},
    )

    response = client.get(f"/api/v1/audit/timeline/project/{audit_project.id}/")
    assert response.status_code == 200
    project_payload = response.json()
    assert project_payload["count"] == 1
    assert project_payload["results"][0]["event_type"] == EventType.EVIDENCE_LINKED

    response = client.get(f"/api/v1/audit/timeline/pile/{audit_pile.id}/")
    assert response.status_code == 200
    pile_payload = response.json()
    assert pile_payload["count"] == 1
    assert pile_payload["results"][0]["pile"] == audit_pile.id
