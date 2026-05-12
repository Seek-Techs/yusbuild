"""
Tests for the Pile Calculation Engine.

All tests verified against TECON Construction Excel data.
"""

import pytest
import math
from django.conf import settings
from apps.piles.calculations import (
    get_kg_per_m,
    get_pi,
    PileCalculator,
    BS8666_BAR_SIZES,
)
from apps.piles.models import Pile, PileTypeConfiguration



class TestKgPerM:
    """Tests for rebar kg/m calculation."""

    def test_y8_kg_per_m(self):
        """Y8 should return 0.394575 kg/m (Excel value)."""
        result = get_kg_per_m(8)
        assert abs(result - 0.394575) < 0.0001

    def test_y16_kg_per_m(self):
        """Y16 should return 1.578298 kg/m (Excel value)."""
        result = get_kg_per_m(16)
        assert abs(result - 1.578298) < 0.0001

    def test_y25_kg_per_m(self):
        """Y25 should return 3.853268 kg/m (Excel value)."""
        result = get_kg_per_m(25)
        assert abs(result - 3.853268) < 0.0001

    def test_invalid_bar_size(self):
        """Invalid bar size should raise ValueError."""
        with pytest.raises(ValueError) as exc_info:
            get_kg_per_m(15)
        assert "Invalid bar size" in str(exc_info.value)

    def test_all_standard_sizes(self):
        """All BS 8666 sizes should be valid."""
        for size in BS8666_BAR_SIZES:
            result = get_kg_per_m(size)
            assert result > 0


class TestPiValue:
    """Tests for PI constant."""

    def test_pi_value(self):
        """PI should be 3.142 (Excel constant, not math.pi)."""
        assert get_pi() == 3.142
        assert get_pi() != math.pi


class TestConcreteCalculation:
    """Tests for concrete volume calculation."""

    def test_concrete_21_2m(self, pile_type_ii):
        """
        500mm pile, 21.2m actual depth.
        Excel value: 4.163150 m3
        """
        result = PileCalculator.calculate_concrete(
            pile_diameter_mm=500,
            design_length_m=20.0,
            actual_length_m=21.2,
        )
        expected = 3.142 * (0.25 ** 2) * 21.2
        assert abs(result.actual_volume_m3 - expected) < 0.0001
        assert abs(result.actual_volume_m3 - 4.16315) < 0.001

    def test_concrete_21_1m(self, pile_type_ii_21_1):
        """
        500mm pile, 21.1m actual depth.
        Excel value: 4.143512 m3
        """
        result = PileCalculator.calculate_concrete(
            pile_diameter_mm=500,
            design_length_m=20.0,
            actual_length_m=21.1,
        )
        expected = 3.142 * (0.25 ** 2) * 21.1
        assert abs(result.actual_volume_m3 - expected) < 0.0001
        assert abs(result.actual_volume_m3 - 4.143512) < 0.001

    def test_concrete_21_3m(self):
        """
        500mm pile, 21.3m actual depth.
        Excel value: 4.182787 m3
        """
        result = PileCalculator.calculate_concrete(
            pile_diameter_mm=500,
            design_length_m=20.0,
            actual_length_m=21.3,
        )
        expected = 3.142 * (0.25 ** 2) * 21.3
        assert abs(result.actual_volume_m3 - expected) < 0.0001

    def test_design_vs_actual_volume(self):
        """Design volume should use design length, actual volume should use actual length."""
        result = PileCalculator.calculate_concrete(
            pile_diameter_mm=500,
            design_length_m=20.0,
            actual_length_m=22.0,
        )
        assert result.design_volume_m3 < result.actual_volume_m3
        assert abs(result.design_volume_m3 - 3.9275) < 0.001


class TestMainBarsCalculation:
    """Tests for main bar weight calculation."""

    def test_type_ii_main_bars(self):
        """
        Type II main bars:
        - Y16 @ 15.78m x 10 bars = 249.055 kg
        - Y25 @ 8.74m x 10 bars = 336.776 kg
        - Total: 585.831 kg
        """
        sections = [
            {"bar_size": 16, "length_per_bar_m": 15.78, "count": 10, "section_name": "full_cage"},
            {"bar_size": 25, "length_per_bar_m": 8.74, "count": 10, "section_name": "short_piece"},
        ]
        results, total = PileCalculator.calculate_main_bars(sections)

        assert len(results) == 2
        assert abs(results[0].weight_kg - 249.055) < 0.1
        assert abs(results[1].weight_kg - 336.776) < 0.1
        assert abs(total - 585.831) < 0.1

    def test_single_section(self):
        """Single section calculation."""
        sections = [
            {"bar_size": 16, "length_per_bar_m": 20.0, "count": 8, "section_name": "full"},
        ]
        results, total = PileCalculator.calculate_main_bars(sections)

        assert len(results) == 1
        expected_length = 20.0 * 8  # 160m
        expected_weight = expected_length * get_kg_per_m(16)
        assert abs(results[0].total_length_m - expected_length) < 0.01
        assert abs(total - expected_weight) < 0.01


class TestHelixCalculation:
    """Tests for helix/spiral calculation."""

    def test_type_ii_helix(self):
        """
        Type II helix:
        - 480mm cage, 250mm pitch, 20m design, 8 end turns
        - 88 turns x 1.50816m = 132.718m
        - 132.718m x 0.394575 kg/m = 52.367 kg
        """
        result = PileCalculator.calculate_helix(
            design_length_m=20.0,
            helix_bar_size_mm=8,
            helix_pitch_mm=250,
            cage_diameter_mm=480,
            end_turns=8,
        )

        assert result.n_turns == 88  # 20/0.25 + 8 = 88
        assert abs(result.circumference_m - 1.50816) < 0.0001
        assert abs(result.total_length_m - 132.71808) < 0.001
        assert abs(result.weight_kg - 52.367) < 0.1

    def test_circumference(self):
        """Circumference = PI x diameter."""
        result = PileCalculator.calculate_helix(
            design_length_m=10.0,
            helix_bar_size_mm=8,
            helix_pitch_mm=200,
            cage_diameter_mm=400,
            end_turns=4,
        )
        expected_circumference = get_pi() * 400 / 1000
        assert abs(result.circumference_m - expected_circumference) < 0.0001


class TestStiffenerCalculation:
    """Tests for stiffener ring calculation."""

    def test_type_ii_stiffeners(self):
        """
        Type II stiffeners:
        - 9 rings x 1.70816m x 1.578298 kg/m = 24.264 kg
        """
        result = PileCalculator.calculate_stiffeners(
            design_length_m=20.0,
            stiffener_bar_size_mm=16,
            stiffener_ring_diameter_mm=543.6,
            stiffener_spacing_m=2.5,
        )

        assert result.n_rings == 9  # floor(20/2.5) + 1 = 9
        assert abs(result.ring_length_m - 1.708) < 0.001
        assert abs(result.total_length_m - (9 * 1.708)) < 0.1
        assert abs(result.weight_kg - 24.264) < 0.1

    def test_stiffener_count_formula(self):
        """n_rings = floor(length / spacing) + 1."""
        result = PileCalculator.calculate_stiffeners(
            design_length_m=15.0,
            stiffener_bar_size_mm=16,
            stiffener_ring_diameter_mm=500.0,
            stiffener_spacing_m=2.5,
        )
        expected_n = math.floor(15.0 / 2.5) + 1  # 7
        assert result.n_rings == expected_n


class TestFullCalculation:
    """End-to-end calculation tests."""

    @pytest.mark.django_db
    def test_type_ii_pile_21_2(self, pile_type_ii):
        """
        Full calculation for Type II pile, 21.2m actual.
        Expected (from Excel):
        - Main bars: ~585.83 kg
        - Helix: ~52.37 kg
        - Stiffeners: ~24.26 kg
        - Total steel: ~662.46 kg
        - Concrete: ~4.163 m3
        """
        result = PileCalculator.calculate(pile_type_ii)

        assert abs(result.main_bars_kg - 585.831) < 1.0
        assert abs(result.helix_kg - 52.367) < 1.0
        assert abs(result.stiffeners_kg - 24.264) < 1.0
        assert abs(result.total_steel_kg - 662.46) < 2.0
        assert abs(result.actual_concrete_m3 - 4.163) < 0.01

    @pytest.mark.django_db
    def test_type_ii_pile_21_1(self, pile_type_ii_21_1):
        """
        Full calculation for Type II pile, 21.1m actual.
        Same steel (design-length based), different concrete.
        """
        result = PileCalculator.calculate(pile_type_ii_21_1)

        # Steel should be same (based on design length, not actual)
        assert abs(result.main_bars_kg - 585.831) < 1.0
        assert abs(result.helix_kg - 52.367) < 1.0
        assert abs(result.stiffeners_kg - 24.264) < 1.0

        # Concrete should be different
        assert abs(result.actual_concrete_m3 - 4.1435) < 0.01

    @pytest.mark.django_db
    def test_result_to_dict(self, pile_type_ii):
        """Result should serialize to dict properly."""
        result = PileCalculator.calculate(pile_type_ii)
        data = result.to_dict()

        assert data["pile_no"] == "P-001"
        assert data["pile_type"] == "TYPE_II"
        assert "steel" in data
        assert "concrete" in data
        assert data["steel"]["total_kg"] > 0
        assert data["concrete"]["actual_m3"] > 0

    @pytest.mark.django_db
    def test_invalid_pile_type_raises(self, project):
        """Pile with no configuration should raise ValueError."""
        pile = Pile.objects.create(
            project=project,
            pile_no="P-BAD",
            pile_type="TYPE_X",
            diameter_mm=500,
            design_length_m=20.0,
            actual_length_m=21.0,
        )

        with pytest.raises(ValueError) as exc_info:
            PileCalculator.calculate(pile)
        assert "No active PileTypeConfiguration" in str(exc_info.value)
