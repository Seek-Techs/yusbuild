"""
Pytest fixtures for YusBuild tests.
"""

import pytest

from apps.piles.models import Pile, PileTypeConfiguration
from apps.projects.models import Project


# Enable Django database for all tests
@pytest.fixture
def project(db):
    """Create a test project."""
    return Project.objects.create(
        name="Refinery Extension Test Pile",
        location="Crude Distillation Unit",
        client="Engineers India Limited",
        description="Residential development at Lekki, Lagos",
        status="ACTIVE",
        created_by="Engr. Yusuf",
    )


@pytest.fixture
def type_ii_config(db):
    """Create Type II pile configuration (from TECON Excel)."""
    return PileTypeConfiguration.objects.create(
        pile_type="TYPE_II",
        description="Type II - Full reinforcement with lapped bars",
        main_bar_sections=[
            {
                "bar_size": 16,
                "length_per_bar_m": 15.78,
                "count": 10,
                "section_name": "full_cage_y16",
            },
            {
                "bar_size": 25,
                "length_per_bar_m": 8.74,
                "count": 10,
                "section_name": "short_piece_y25",
            },
        ],
        lap_length_m=1.2,
        helix_bar_size_mm=8,
        helix_pitch_mm=250,
        cage_diameter_mm=480,
        helix_end_turns=8,
        stiffener_bar_size_mm=16,
        stiffener_ring_diameter_mm=543.6,
        stiffener_spacing_m=2.5,
        concrete_cover_mm=20,
    )


@pytest.fixture
def type_iii_config(db):
    """Create Type III pile configuration."""
    return PileTypeConfiguration.objects.create(
        pile_type="TYPE_III",
        description="Type III - Enhanced reinforcement",
        main_bar_sections=[
            {
                "bar_size": 16,
                "length_per_bar_m": 15.78,
                "count": 10,
                "section_name": "full_cage_y16",
            },
            {
                "bar_size": 25,
                "length_per_bar_m": 8.74,
                "count": 10,
                "section_name": "short_piece_y25",
            },
        ],
        lap_length_m=1.2,
        helix_bar_size_mm=8,
        helix_pitch_mm=250,
        cage_diameter_mm=480,
        helix_end_turns=8,
        stiffener_bar_size_mm=16,
        stiffener_ring_diameter_mm=543.6,
        stiffener_spacing_m=2.0,
        concrete_cover_mm=20,
    )


@pytest.fixture
def pile_type_ii(project, type_ii_config):
    """Create a Type II pile matching TECON Excel data."""
    return Pile.objects.create(
        project=project,
        pile_no="P-001",
        pile_type="TYPE_II",
        diameter_mm=500,
        design_length_m=20.0,
        actual_length_m=21.2,
        piling_method="Driven Cast In-Situ",
        concrete_grade="C35/40",
        location_on_site="Crude Distillation Unit",
        drawing_reference="A545-700-81-30004",
    )


@pytest.fixture
def pile_type_ii_21_1(project, type_ii_config):
    """Create Type II pile with 21.1m actual depth (PILE 2 from Excel)."""
    return Pile.objects.create(
        project=project,
        pile_no="P-002",
        pile_type="TYPE_II",
        diameter_mm=500,
        design_length_m=20.0,
        actual_length_m=21.1,
        piling_method="Driven Cast In-Situ",
        concrete_grade="C35/40",
    )


@pytest.fixture
def pile_type_iii(project, type_iii_config):
    """Create a Type III pile."""
    return Pile.objects.create(
        project=project,
        pile_no="P-003",
        pile_type="TYPE_III",
        diameter_mm=500,
        design_length_m=20.0,
        actual_length_m=23.5,
        piling_method="Driven Cast In-Situ",
        concrete_grade="C35/40",
    )
