"""
Persistence services for pile calculations.
"""

from django.db import transaction

from apps.piles.calculations import PileCalculator, get_pi
from apps.piles.models import (
    Pile,
    PileCalculation,
    PileCalculationHistory,
    PileTypeConfiguration,
)


CALCULATION_VERSION = "1.0.0"


def _user_or_none(user):
    if user is None or not getattr(user, "is_authenticated", False):
        return None
    return user


def build_input_snapshot(pile: Pile) -> dict:
    """Return calculation inputs captured at calculation time."""
    return {
        "pile_id": pile.id,
        "project_id": pile.project_id,
        "pile_no": pile.pile_no,
        "pile_type": pile.pile_type,
        "diameter_mm": pile.diameter_mm,
        "design_length_m": pile.design_length_m,
        "actual_length_m": pile.actual_length_m,
    }


def build_config_snapshot(config: PileTypeConfiguration) -> dict:
    """Return pile type configuration captured at calculation time."""
    return {
        "config_id": config.id,
        "pile_type": config.pile_type,
        "version": config.version,
        "main_bar_sections": config.main_bar_sections,
        "lap_length_m": config.lap_length_m,
        "helix_bar_size_mm": config.helix_bar_size_mm,
        "helix_pitch_mm": config.helix_pitch_mm,
        "cage_diameter_mm": config.cage_diameter_mm,
        "helix_end_turns": config.helix_end_turns,
        "stiffener_bar_size_mm": config.stiffener_bar_size_mm,
        "stiffener_ring_diameter_mm": config.stiffener_ring_diameter_mm,
        "stiffener_spacing_m": config.stiffener_spacing_m,
        "concrete_cover_mm": config.concrete_cover_mm,
    }


def build_constants_snapshot() -> dict:
    """Return calculation constants captured at calculation time."""
    from django.conf import settings

    return {
        "pi": get_pi(),
        "kg_per_m_factor": getattr(settings, "YUSBUILD_KG_PER_M_FACTOR", 162.2),
    }


@transaction.atomic
def calculate_and_persist_pile(
    pile: Pile,
    *,
    triggered_by=None,
    trigger: str = PileCalculationHistory.TRIGGER_RECALCULATE,
    reason: str = "",
) -> tuple[PileCalculation, PileCalculationHistory, object]:
    """
    Calculate a pile, update the current calculation, and append history.

    Returns:
        (current calculation, history record, calculation result)
    """
    result = PileCalculator.calculate(pile)
    config = PileTypeConfiguration.objects.get(
        pile_type=pile.pile_type,
        is_active=True,
    )

    calculation, _ = PileCalculation.objects.update_or_create(
        pile=pile,
        defaults={
            "main_bars_kg": result.main_bars_kg,
            "helix_kg": result.helix_kg,
            "stiffeners_kg": result.stiffeners_kg,
            "total_steel_kg": result.total_steel_kg,
            "design_concrete_m3": result.design_concrete_m3,
            "actual_concrete_m3": result.actual_concrete_m3,
            "calculation_version": CALCULATION_VERSION,
        },
    )

    history = PileCalculationHistory.objects.create(
        pile=pile,
        calculation=calculation,
        triggered_by=_user_or_none(triggered_by),
        trigger=trigger,
        reason=reason,
        calculation_version=CALCULATION_VERSION,
        config_version=config.version,
        input_snapshot=build_input_snapshot(pile),
        config_snapshot=build_config_snapshot(config),
        constants_snapshot=build_constants_snapshot(),
        result_snapshot=result.to_dict(),
    )

    pile.calculation = calculation
    return calculation, history, result
