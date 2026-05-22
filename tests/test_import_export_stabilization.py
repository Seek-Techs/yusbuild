import io
import json

import pytest
from django.contrib.auth import get_user_model

from apps.piles.importers import import_pile_schedule_csv
from apps.piles.models import PileTypeConfiguration, Pile
from apps.piles.serializers import PileCreateUpdateSerializer, PileSummarySerializer
from apps.projects.models import Project, ProjectMembership


@pytest.mark.django_db
def test_importer_dry_run_does_not_persist(project):
    csv_content = (
        "pile_no,pile_type,diameter_mm,design_length_m,actual_length_m,project\n"
        "DRY1,BORED,600,10.0,9.5,{project_id}\n"
    ).format(project_id=project.id)

    f = io.StringIO(csv_content)
    f.name = "dry.csv"
    created, errors = import_pile_schedule_csv(f, dry_run=True)
    assert len(created) == 1
    assert errors == []
    # ensure not persisted
    assert not Pile.objects.filter(pile_no="DRY1").exists()


@pytest.mark.django_db
def test_importer_reports_row_errors(project):
    csv_content = (
        "pile_no,pile_type,diameter_mm,design_length_m,actual_length_m,project\n"
        "ERR1,BORED,INVALID,10.0,9.5,{project_id}\n"
    ).format(project_id=project.id)

    f = io.StringIO(csv_content)
    f.name = "err.csv"
    created, errors = import_pile_schedule_csv(f, dry_run=True)
    assert len(created) == 0
    assert len(errors) == 1
    assert errors[0]["row"] == 2 or errors[0]["row"] == 2


@pytest.mark.django_db
def test_serializer_to_internal_value_and_validation(project, db):
    # Ensure a PileTypeConfiguration exists for TYPE_I
    PileTypeConfiguration.objects.get_or_create(pile_type="TYPE_I", defaults={"is_active": True})

    User = get_user_model()
    user = User.objects.create_user(username="su", password="pw", is_superuser=True)

    data = {
        "pile_no": "S-1",
        "pile_type": "TYPE 1",
        "diameter_mm": "500",
        "design_length_m": "12.0",
        "actual_length_m": "12.0",
        "project": project.id,
    }

    # Provide a minimal request-like object for context
    request = type("Rq", (), {"user": user})()
    serializer = PileCreateUpdateSerializer(data=data, context={"request": request})
    assert serializer.is_valid(), serializer.errors
    pile = serializer.save()
    assert pile.pile_no == "S-1"


@pytest.mark.django_db
def test_summary_serializer_handles_missing_calculation(project):
    p = Pile.objects.create(
        pile_no="SUM1",
        project=project,
        pile_type="BORED",
        diameter_mm=600,
        design_length_m=10.0,
        actual_length_m=9.5,
    )
    ser = PileSummarySerializer(p)
    data = ser.data
    # When calculation missing, fields should be present and zeroed
    assert data["steel_kg"] == 0.0
    assert data["steel_tons"] == 0.0
    assert data["concrete_m3"] == 0.0
