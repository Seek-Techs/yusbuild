"""
API endpoint tests for YusBuild.
Tests all CRUD operations and custom actions.
"""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.projects.models import Project
from apps.piles.models import Pile, PileTypeConfiguration, PileCalculation


@pytest.fixture
def api_client():
    """Create API test client."""
    return APIClient()


class TestHealthEndpoint:
    """Tests for health check endpoint."""

    def test_health_check(self, api_client):
        """Health endpoint should return 200 with status ok."""
        response = api_client.get("/health/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "ok"
        assert response.data["service"] == "yusbuild-api"


class TestProjectEndpoints:
    """Tests for Project CRUD endpoints."""

    def test_list_projects(self, api_client, project):
        """GET /api/v1/projects/ should return project list."""
        response = api_client.get("/api/v1/projects/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_create_project(self, api_client):
        """POST /api/v1/projects/ should create project."""
        data = {
            "name": "New Bridge Project",
            "location": "Lekki, Lagos",
            "client": "Lekki Development Corp",
            "description": "Bridge foundation works",
            "status": "ACTIVE",
            "created_by": "Engr. Yusuf",
        }
        response = api_client.post("/api/v1/projects/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Bridge Project"

    def test_get_project(self, api_client, project):
        """GET /api/v1/projects/{id}/ should return project."""
        response = api_client.get(f"/api/v1/projects/{project.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == project.name

    def test_update_project(self, api_client, project):
        """PUT /api/v1/projects/{id}/ should update project."""
        data = {
            "name": "Updated Name",
            "location": project.location,
            "client": project.client,
            "status": project.status,
        }
        response = api_client.put(
            f"/api/v1/projects/{project.id}/", data, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Name"

    def test_delete_project(self, api_client, project):
        """DELETE /api/v1/projects/{id}/ should delete project."""
        response = api_client.delete(f"/api/v1/projects/{project.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Project.objects.filter(id=project.id).exists()


class TestPileEndpoints:
    """Tests for Pile CRUD endpoints."""

    def test_list_piles(self, api_client, pile_type_ii):
        """GET /api/v1/piles/ should return pile list."""
        response = api_client.get("/api/v1/piles/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_create_pile(self, api_client, project, type_ii_config):
        """POST /api/v1/piles/ should create pile with auto-calculation."""
        data = {
            "pile_no": "P-NEW-001",
            "pile_type": "TYPE_II",
            "project": project.id,
            "diameter_mm": 500,
            "design_length_m": 20.0,
            "actual_length_m": 21.2,
            "piling_method": "Driven Cast In-Situ",
            "concrete_grade": "C35/40",
        }
        response = api_client.post("/api/v1/piles/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["pile_no"] == "P-NEW-001"
        assert response.data["calculation_result"] is not None
        assert response.data["calculation_result"]["steel"]["total_kg"] > 0

    def test_get_pile(self, api_client, pile_type_ii):
        """GET /api/v1/piles/{id}/ should return pile with calculation."""
        response = api_client.get(f"/api/v1/piles/{pile_type_ii.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["pile_no"] == pile_type_ii.pile_no
        assert "calculation" in response.data

    def test_update_pile(self, api_client, pile_type_ii):
        """PATCH /api/v1/piles/{id}/ should update and recalculate."""
        data = {"actual_length_m": 22.0, "notes": "Updated depth after drilling"}
        response = api_client.patch(
            f"/api/v1/piles/{pile_type_ii.id}/", data, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["actual_length_m"] == 22.0

    def test_delete_pile(self, api_client, pile_type_ii):
        """DELETE /api/v1/piles/{id}/ should delete pile."""
        pile_id = pile_type_ii.id
        response = api_client.delete(f"/api/v1/piles/{pile_type_ii.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Pile.objects.filter(id=pile_id).exists()


class TestPileCustomActions:
    """Tests for pile custom actions."""

    def test_recalculate(self, api_client, pile_type_ii):
        """POST /api/v1/piles/{id}/recalculate/ should force recalculation."""
        response = api_client.post(
            f"/api/v1/piles/{pile_type_ii.id}/recalculate/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert "result" in response.data
        assert response.data["result"]["steel"]["total_kg"] > 0

    def test_breakdown(self, api_client, pile_type_ii):
        """GET /api/v1/piles/{id}/breakdown/ should return full breakdown."""
        response = api_client.get(
            f"/api/v1/piles/{pile_type_ii.id}/breakdown/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert "steel" in response.data
        assert "concrete" in response.data
        assert "main_bars" in response.data["steel"]
        assert "helix" in response.data["steel"]
        assert "stiffeners" in response.data["steel"]


class TestBOQEndpoint:
    """Tests for BOQ generation endpoint."""

    def test_boq_empty_project(self, api_client, project):
        """BOQ for project with no piles should return empty."""
        response = api_client.get(f"/api/v1/projects/{project.id}/boq/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["grand_totals"]["total_piles"] == 0

    def test_boq_with_piles(self, api_client, pile_type_ii):
        """BOQ should aggregate pile data correctly."""
        project_id = pile_type_ii.project.id
        response = api_client.get(f"/api/v1/projects/{project_id}/boq/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["grand_totals"]["total_piles"] >= 1
        assert response.data["grand_totals"]["total_steel_kg"] > 0
        assert "summary_by_type" in response.data
        assert "steel_distribution" in response.data

    def test_boq_summary_by_type(self, api_client, pile_type_ii, pile_type_iii):
        """BOQ should group by pile type."""
        project_id = pile_type_ii.project.id
        response = api_client.get(f"/api/v1/projects/{project_id}/boq/")
        assert response.status_code == status.HTTP_200_OK

        summary = response.data["summary_by_type"]
        assert len(summary) >= 2  # At least TYPE_II and TYPE_III

    def test_boq_steel_distribution(self, api_client, pile_type_ii):
        """BOQ should include steel distribution percentages."""
        project_id = pile_type_ii.project.id
        response = api_client.get(f"/api/v1/projects/{project_id}/boq/")
        assert response.status_code == status.HTTP_200_OK

        dist = response.data["steel_distribution"]
        assert "main_bars" in dist
        assert "helix" in dist
        assert "stiffeners" in dist
        assert dist["main_bars"]["percentage"] > 0


class TestPileTypeConfigEndpoints:
    """Tests for pile type configuration endpoints."""

    def test_list_configs(self, api_client, type_ii_config):
        """GET /api/v1/piles/configs/ should return configurations."""
        response = api_client.get("/api/v1/piles/configs/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_get_config(self, api_client, type_ii_config):
        """GET /api/v1/piles/configs/{pile_type}/ should return config."""
        response = api_client.get("/api/v1/piles/configs/TYPE_II/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["pile_type"] == "TYPE_II"
        assert len(response.data["main_bar_sections"]) == 2


class TestValidation:
    """Tests for input validation."""

    def test_duplicate_pile_no(self, api_client, project, pile_type_ii, type_ii_config):
        """Creating duplicate pile_no in same project should fail."""
        data = {
            "pile_no": pile_type_ii.pile_no,  # Duplicate
            "pile_type": "TYPE_II",
            "project": project.id,
            "diameter_mm": 500,
            "design_length_m": 20.0,
            "actual_length_m": 21.0,
        }
        response = api_client.post("/api/v1/piles/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_bar_size(self):
        """Invalid bar size should raise ValueError."""
        from apps.piles.calculations import get_kg_per_m
        with pytest.raises(ValueError):
            get_kg_per_m(15)

    def test_invalid_pile_type(self, api_client, project):
        """Creating pile with invalid type should fail gracefully."""
        data = {
            "pile_no": "P-BAD",
            "pile_type": "INVALID_TYPE",
            "project": project.id,
            "diameter_mm": 500,
            "design_length_m": 20.0,
            "actual_length_m": 21.0,
        }
        response = api_client.post("/api/v1/piles/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
