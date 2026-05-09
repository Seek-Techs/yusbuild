"""
Pile Reinforcement Calculation Engine.

Reverse-engineered from TECON Construction Excel sheets
for Engineers India Limited - Refinery Extension Test Pile.

Uses BS 8666 rebar standards with Excel-specific constants:
  - PI = 3.142 (not math.pi)
  - kg/m factor = 162.2 (not standard 162.25)

All formulas verified against Excel output data.
"""

import logging
import math
from dataclasses import dataclass, field
from typing import List, Dict, Any
from django.conf import settings

logger = logging.getLogger(__name__)


# ============================================================
# BS 8666 REBAR DATA
# ============================================================

# Standard bar sizes available (mm)
BS8666_BAR_SIZES = [6, 8, 10, 12, 16, 20, 25, 28, 32, 40]

# Standard kg/m values (can be overridden by formula)
BS8666_STANDARD_KG_M = {
    6: 0.222,
    8: 0.395,
    10: 0.617,
    12: 0.888,
    16: 1.579,
    20: 2.466,
    25: 3.854,
    28: 4.830,
    32: 6.313,
    40: 9.864,
}


def get_kg_per_m(bar_diameter_mm: int, factor: float = None) -> float:
    """
    Calculate rebar weight per meter using the Excel-compatible formula.

    Formula: kg/m = (diameter^2) / factor

    The Excel uses factor = 162.2 (not the standard BS 8666 162.25)
    to match TECON's existing calculations exactly.

    Args:
        bar_diameter_mm: Bar diameter in mm
        factor: Optional override for the divisor (default from settings)

    Returns:
        Weight per meter in kg/m

    Raises:
        ValueError: If bar diameter is not a valid BS 8666 size
    """
    if bar_diameter_mm not in BS8666_BAR_SIZES:
        raise ValueError(
            f"Invalid bar size Y{bar_diameter_mm}. "
            f"Must be one of: {BS8666_BAR_SIZES}"
        )

    if factor is None:
        factor = getattr(settings, "YUSBUILD_KG_PER_M_FACTOR", 162.2)

    return (bar_diameter_mm ** 2) / factor


def get_pi() -> float:
    """Return PI value matching Excel (3.142, not math.pi)."""
    return getattr(settings, "YUSBUILD_PI_VALUE", 3.142)


# ============================================================
# CALCULATION RESULT DATA CLASSES
# ============================================================

@dataclass
class MainBarSectionResult:
    """Result for one main bar section."""
    section_name: str
    bar_size_mm: int
    count: int
    length_per_bar_m: float
    total_length_m: float
    kg_per_m: float
    weight_kg: float


@dataclass
class HelixResult:
    """Result for helix/spiral calculation."""
    bar_size_mm: int
    pitch_mm: int
    cage_diameter_mm: int
    circumference_m: float
    n_turns: int
    total_length_m: float
    kg_per_m: float
    weight_kg: float


@dataclass
class StiffenerResult:
    """Result for stiffener ring calculation."""
    bar_size_mm: int
    ring_diameter_mm: float
    ring_length_m: float
    n_rings: int
    total_length_m: float
    kg_per_m: float
    weight_kg: float


@dataclass
class ConcreteResult:
    """Result for concrete volume calculation."""
    pile_diameter_mm: int
    design_length_m: float
    actual_length_m: float
    design_volume_m3: float
    actual_volume_m3: float


@dataclass
class PileCalculationResult:
    """Complete calculation result for a pile."""
    pile_no: str
    pile_type: str
    diameter_mm: int
    design_length_m: float
    actual_length_m: float

    # Steel
    main_bar_sections: List[MainBarSectionResult] = field(default_factory=list)
    main_bars_kg: float = 0.0
    helix: HelixResult = None
    helix_kg: float = 0.0
    stiffener: StiffenerResult = None
    stiffeners_kg: float = 0.0
    total_steel_kg: float = 0.0

    # Concrete
    concrete: ConcreteResult = None
    design_concrete_m3: float = 0.0
    actual_concrete_m3: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert result to API-friendly dictionary."""
        return {
            "pile_no": self.pile_no,
            "pile_type": self.pile_type,
            "diameter_mm": self.diameter_mm,
            "design_length_m": self.design_length_m,
            "actual_length_m": self.actual_length_m,
            "steel": {
                "main_bars": {
                    "total_kg": round(self.main_bars_kg, 3),
                    "sections": [
                        {
                            "section_name": s.section_name,
                            "bar_size": f"Y{s.bar_size_mm}",
                            "count": s.count,
                            "length_per_bar_m": s.length_per_bar_m,
                            "total_length_m": round(s.total_length_m, 2),
                            "weight_kg": round(s.weight_kg, 3),
                        }
                        for s in self.main_bar_sections
                    ],
                },
                "helix": {
                    "bar_size": f"Y{self.helix.bar_size_mm}" if self.helix else None,
                    "pitch_mm": self.helix.pitch_mm if self.helix else None,
                    "n_turns": self.helix.n_turns if self.helix else None,
                    "total_length_m": round(self.helix.total_length_m, 3) if self.helix else None,
                    "weight_kg": round(self.helix_kg, 3),
                },
                "stiffeners": {
                    "bar_size": f"Y{self.stiffener.bar_size_mm}" if self.stiffener else None,
                    "n_rings": self.stiffener.n_rings if self.stiffener else None,
                    "ring_diameter_mm": round(self.stiffener.ring_diameter_mm, 1) if self.stiffener else None,
                    "total_length_m": round(self.stiffener.total_length_m, 3) if self.stiffener else None,
                    "weight_kg": round(self.stiffeners_kg, 3),
                },
                "total_kg": round(self.total_steel_kg, 3),
                "total_tons": round(self.total_steel_kg / 1000, 3),
            },
            "concrete": {
                "design_m3": round(self.design_concrete_m3, 6),
                "actual_m3": round(self.actual_concrete_m3, 6),
            },
        }


# ============================================================
# CALCULATION ENGINE
# ============================================================

class PileCalculator:
    """
    Pile reinforcement calculation engine.

    Implements formulas reverse-engineered from TECON Construction
    Excel sheets for BS 8666 compliant pile reinforcement BOQ.
    """

    @staticmethod
    def calculate_concrete(
        pile_diameter_mm: int,
        design_length_m: float,
        actual_length_m: float,
    ) -> ConcreteResult:
        """
        Calculate concrete volume.

        Formula: V = PI * R^2 * H
        Where: PI = 3.142, R = diameter/2 (in meters), H = depth

        Verified against Excel:
          - 500mm dia, 21.1m actual -> 4.143512 m3
          - 500mm dia, 21.2m actual -> 4.163150 m3
        """
        pi = get_pi()
        radius_m = pile_diameter_mm / 2 / 1000

        design_volume = pi * (radius_m ** 2) * design_length_m
        actual_volume = pi * (radius_m ** 2) * actual_length_m

        return ConcreteResult(
            pile_diameter_mm=pile_diameter_mm,
            design_length_m=design_length_m,
            actual_length_m=actual_length_m,
            design_volume_m3=design_volume,
            actual_volume_m3=actual_volume,
        )

    @staticmethod
    def calculate_main_bars(
        main_bar_sections: List[Dict[str, Any]],
    ) -> tuple[List[MainBarSectionResult], float]:
        """
        Calculate main bar weight.

        For each section: weight = length_per_bar * count * kg_per_m

        Verified against Excel Type II:
          - Y16 @ 15.78m x 10 bars -> 249.055 kg
          - Y25 @ 8.74m x 10 bars -> 336.776 kg
          - Total: 585.831 kg
        """
        results = []
        total_weight = 0.0

        for section in main_bar_sections:
            bar_size = int(section["bar_size"])
            count = int(section["count"])
            length_per_bar = float(section["length_per_bar_m"])

            kg_m = get_kg_per_m(bar_size)
            total_length = length_per_bar * count
            weight = total_length * kg_m

            results.append(
                MainBarSectionResult(
                    section_name=section.get("section_name", ""),
                    bar_size_mm=bar_size,
                    count=count,
                    length_per_bar_m=length_per_bar,
                    total_length_m=total_length,
                    kg_per_m=kg_m,
                    weight_kg=weight,
                )
            )
            total_weight += weight

        return results, total_weight

    @staticmethod
    def calculate_helix(
        design_length_m: float,
        helix_bar_size_mm: int,
        helix_pitch_mm: int,
        cage_diameter_mm: int,
        end_turns: int,
    ) -> HelixResult:
        """
        Calculate helix/spiral reinforcement weight.

        Formulas:
          1. Circumference = PI * cage_diameter (meters)
          2. n_turns = (design_length / pitch_m) + end_turns
          3. total_length = n_turns * circumference (simplified, not Pythagorean)
          4. weight = total_length * kg_per_m

        Verified against Excel Type II:
          - 480mm cage, 250mm pitch, 20m design, 8 end turns
          - 88 turns x 1.50816m = 132.718m
          - 132.718m x 0.394575 kg/m = 52.367 kg
        """
        pi = get_pi()

        circumference = pi * cage_diameter_mm / 1000  # meters
        pitch_m = helix_pitch_mm / 1000
        n_turns = int(design_length_m / pitch_m) + end_turns
        total_length = n_turns * circumference
        kg_m = get_kg_per_m(helix_bar_size_mm)
        weight = total_length * kg_m

        return HelixResult(
            bar_size_mm=helix_bar_size_mm,
            pitch_mm=helix_pitch_mm,
            cage_diameter_mm=cage_diameter_mm,
            circumference_m=circumference,
            n_turns=n_turns,
            total_length_m=total_length,
            kg_per_m=kg_m,
            weight_kg=weight,
        )

    @staticmethod
    def calculate_stiffeners(
        design_length_m: float,
        stiffener_bar_size_mm: int,
        stiffener_ring_diameter_mm: float,
        stiffener_spacing_m: float,
    ) -> StiffenerResult:
        """
        Calculate stiffener ring weight.

        Formulas:
          1. n_rings = floor(design_length / spacing) + 1
          2. ring_length = PI * ring_diameter (meters)
          3. total_length = n_rings * ring_length
          4. weight = total_length * kg_per_m

        Verified against Excel Type II:
          - 9 rings x 1.70816m x 1.578298 kg/m = 24.264 kg
        """
        pi = get_pi()

        n_rings = math.floor(design_length_m / stiffener_spacing_m) + 1
        ring_length = pi * stiffener_ring_diameter_mm / 1000  # meters
        total_length = n_rings * ring_length
        kg_m = get_kg_per_m(stiffener_bar_size_mm)
        weight = total_length * kg_m

        return StiffenerResult(
            bar_size_mm=stiffener_bar_size_mm,
            ring_diameter_mm=stiffener_ring_diameter_mm,
            ring_length_m=ring_length,
            n_rings=n_rings,
            total_length_m=total_length,
            kg_per_m=kg_m,
            weight_kg=weight,
        )

    @classmethod
    def calculate(cls, pile) -> PileCalculationResult:
        """
        Run full calculation for a pile.

        Args:
            pile: Pile model instance with related type_config

        Returns:
            PileCalculationResult with all quantities

        Raises:
            ValueError: If pile type configuration is not found
        """
        logger.info(
            "Calculating pile %s (type=%s, design=%.1fm, actual=%.1fm)",
            pile.pile_no,
            pile.pile_type,
            pile.design_length_m,
            pile.actual_length_m,
        )

        # Get or create type configuration
        from apps.piles.models import PileTypeConfiguration
        try:
            type_config = PileTypeConfiguration.objects.get(
                pile_type=pile.pile_type,
                is_active=True,
            )
        except PileTypeConfiguration.DoesNotExist:
            logger.error(
                "No active configuration found for pile type: %s",
                pile.pile_type,
            )
            raise ValueError(
                f"No active PileTypeConfiguration found for {pile.pile_type}"
            )

        # 1. Concrete
        concrete = cls.calculate_concrete(
            pile_diameter_mm=pile.diameter_mm,
            design_length_m=pile.design_length_m,
            actual_length_m=pile.actual_length_m,
        )

        # 2. Main Bars
        main_sections, main_bars_kg = cls.calculate_main_bars(
            main_bar_sections=type_config.main_bar_sections,
        )

        # 3. Helix
        helix = cls.calculate_helix(
            design_length_m=pile.design_length_m,
            helix_bar_size_mm=type_config.helix_bar_size_mm,
            helix_pitch_mm=type_config.helix_pitch_mm,
            cage_diameter_mm=type_config.cage_diameter_mm,
            end_turns=type_config.helix_end_turns,
        )

        # 4. Stiffeners
        stiffener = cls.calculate_stiffeners(
            design_length_m=pile.design_length_m,
            stiffener_bar_size_mm=type_config.stiffener_bar_size_mm,
            stiffener_ring_diameter_mm=type_config.stiffener_ring_diameter_mm,
            stiffener_spacing_m=type_config.stiffener_spacing_m,
        )

        # Totals
        total_steel_kg = main_bars_kg + helix.weight_kg + stiffener.weight_kg

        result = PileCalculationResult(
            pile_no=pile.pile_no,
            pile_type=pile.pile_type,
            diameter_mm=pile.diameter_mm,
            design_length_m=pile.design_length_m,
            actual_length_m=pile.actual_length_m,
            main_bar_sections=main_sections,
            main_bars_kg=main_bars_kg,
            helix=helix,
            helix_kg=helix.weight_kg,
            stiffener=stiffener,
            stiffeners_kg=stiffener.weight_kg,
            total_steel_kg=total_steel_kg,
            concrete=concrete,
            design_concrete_m3=concrete.design_volume_m3,
            actual_concrete_m3=concrete.actual_volume_m3,
        )

        logger.info(
            "Pile %s calculated: steel=%.2f kg, concrete=%.4f m3",
            pile.pile_no,
            total_steel_kg,
            concrete.actual_volume_m3,
        )

        return result
