"""Service for generating Project Bill of Quantities (BOQ).

Phase 6B.2 Commit 1:
- Extracts orchestration duplicated in ProjectViewSet.boq() and boq_csv().
- Preserves existing API responses, repair-missing-calculation behavior,
  percentage calculations, and rounding.

No architectural redesign is introduced.
"""

from __future__ import annotations

from typing import Any

import logging

from apps.piles.models import PileCalculationHistory
from apps.piles.services import calculate_and_persist_pile

logger = logging.getLogger(__name__)


_BOQ_CSV_HEADER = [
    "Pile No",
    "Pile Type",
    "Diameter (mm)",
    "Design Length (m)",
    "Actual Length (m)",
    "Steel (kg)",
    "Steel (tons)",
    "Concrete (m3)",
    "Main Bars (kg)",
    "Helix (kg)",
    "Stiffeners (kg)",
]


def _repair_missing_calculation(pile: Any, *, actor: Any, reason: str) -> None:
    """Repairs a missing pile.calculation in-place, matching existing behavior."""

    if getattr(pile, "calculation", None) is not None:
        return

    logger.warning(
        "Pile %s has no calculation record; recalculating before BOQ", pile.pile_no
    )
    calc, _, _ = calculate_and_persist_pile(
        pile,
        triggered_by=actor,
        trigger=PileCalculationHistory.TRIGGER_BOQ_REPAIR,
        reason=reason,
    )
    setattr(pile, "calculation", calc)


def _get_calc_values(pile: Any) -> tuple[float, float, float, float, float, float]:
    """Return rounded numeric values used by both BOQ JSON and BOQ CSV."""

    calc = getattr(pile, "calculation", None)
    if calc is None:
        return (0.0, 0.0, 0.0, 0.0, 0.0, 0.0)

    steel_kg = round(calc.total_steel_kg, 2)
    steel_tons = round(calc.total_steel_kg / 1000, 2)
    concrete_m3 = round(calc.actual_concrete_m3, 4)
    main_bars_kg = round(calc.main_bars_kg, 2)
    helix_kg = round(calc.helix_kg, 2)
    stiffeners_kg = round(calc.stiffeners_kg, 2)
    return steel_kg, steel_tons, concrete_m3, main_bars_kg, helix_kg, stiffeners_kg


def generate_boq(project: Any, *, actor: Any) -> dict[str, Any]:
    """Generate BOQ JSON payload identical to ProjectViewSet.boq()."""

    piles = project.piles.select_related("calculation").all()

    if not piles:
        return {
            "project": project.name,
            "message": "No piles found for this project",
            "summary": {},
            "piles": [],
            "grand_totals": {
                "total_piles": 0,
                "total_steel_kg": 0.0,
                "total_steel_tons": 0.0,
                "total_concrete_m3": 0.0,
            },
        }

    type_summary: dict[str, Any] = {}
    pile_details: list[dict[str, Any]] = []

    for pile in piles:
        calc = getattr(pile, "calculation", None)
        if calc is None:
            logger.warning(
                "Pile %s has no calculation record; recalculating before BOQ",
                pile.pile_no,
            )
            calc, _, _ = calculate_and_persist_pile(
                pile,
                triggered_by=actor,
                trigger=PileCalculationHistory.TRIGGER_BOQ_REPAIR,
                reason="Missing calculation repaired during BOQ generation",
            )
            setattr(pile, "calculation", calc)

        ptype = pile.pile_type

        if ptype not in type_summary:
            type_summary[ptype] = {
                "pile_type": ptype,
                "count": 0,
                "total_steel_kg": 0.0,
                "total_steel_tons": 0.0,
                "total_concrete_m3": 0.0,
            }

        type_summary[ptype]["count"] += 1
        type_summary[ptype]["total_steel_kg"] += calc.total_steel_kg
        type_summary[ptype]["total_concrete_m3"] += calc.actual_concrete_m3

        pile_details.append(
            {
                "pile_no": pile.pile_no,
                "pile_type": ptype,
                "diameter_mm": pile.diameter_mm,
                "design_length_m": pile.design_length_m,
                "actual_length_m": pile.actual_length_m,
                "steel_kg": round(calc.total_steel_kg, 2),
                "steel_tons": round(calc.total_steel_kg / 1000, 2),
                "concrete_m3": round(calc.actual_concrete_m3, 4),
                "breakdown": {
                    "main_bars_kg": round(calc.main_bars_kg, 2),
                    "helix_kg": round(calc.helix_kg, 2),
                    "stiffeners_kg": round(calc.stiffeners_kg, 2),
                },
            }
        )

    for ts in type_summary.values():
        ts["total_steel_tons"] = round(ts["total_steel_kg"] / 1000, 2)
        ts["total_steel_kg"] = round(ts["total_steel_kg"], 2)
        ts["total_concrete_m3"] = round(ts["total_concrete_m3"], 4)

    total_steel_kg = sum(item["steel_kg"] for item in pile_details)
    total_concrete_m3 = sum(item["concrete_m3"] for item in pile_details)

    grand_totals = {
        "total_piles": len(pile_details),
        "total_steel_kg": round(total_steel_kg, 2),
        "total_steel_tons": round(total_steel_kg / 1000, 2),
        "total_concrete_m3": round(total_concrete_m3, 4),
    }

    main_bars_kg = sum(
        pile.calculation.main_bars_kg
        for pile in piles
        if getattr(pile, "calculation", None) is not None
    )
    helix_kg = sum(
        pile.calculation.helix_kg
        for pile in piles
        if getattr(pile, "calculation", None) is not None
    )
    stiffeners_kg = sum(
        pile.calculation.stiffeners_kg
        for pile in piles
        if getattr(pile, "calculation", None) is not None
    )

    steel_distribution = {
        "main_bars": {
            "kg": round(main_bars_kg, 2),
            "percentage": (
                round(main_bars_kg / total_steel_kg * 100, 1)
                if total_steel_kg > 0
                else 0
            ),
        },
        "helix": {
            "kg": round(helix_kg, 2),
            "percentage": (
                round(helix_kg / total_steel_kg * 100, 1) if total_steel_kg > 0 else 0
            ),
        },
        "stiffeners": {
            "kg": round(stiffeners_kg, 2),
            "percentage": (
                round(stiffeners_kg / total_steel_kg * 100, 1)
                if total_steel_kg > 0
                else 0
            ),
        },
    }

    logger.info(
        "BOQ generated for project %s: %s piles, %.2f kg steel",
        project.name,
        len(piles),
        grand_totals["total_steel_kg"],
    )

    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "location": project.location,
            "client": project.client,
            "status": project.status,
        },
        "summary_by_type": list(type_summary.values()),
        "steel_distribution": steel_distribution,
        "piles": pile_details,
        "grand_totals": grand_totals,
    }


def generate_boq_csv_rows(project: Any, *, actor: Any) -> list[list[Any]]:
    """Generate CSV row values identical to ProjectViewSet.boq_csv()."""

    piles = project.piles.select_related("calculation").all()

    rows: list[list[Any]] = []
    for pile in piles:
        calc = getattr(pile, "calculation", None)
        if calc is None:
            try:
                calc, _, _ = calculate_and_persist_pile(
                    pile,
                    triggered_by=actor,
                    trigger=PileCalculationHistory.TRIGGER_BOQ_REPAIR,
                    reason="Missing calculation repaired during BOQ CSV export",
                )
                setattr(pile, "calculation", calc)
            except Exception as exc:
                logger.warning(
                    "Unable to repair missing calculation for pile %s: %s",
                    pile.pile_no,
                    str(exc),
                )

        steel_kg, steel_tons, concrete_m3, main_bars_kg, helix_kg, stiffeners_kg = (
            _get_calc_values(pile)
        )

        rows.append(
            [
                pile.pile_no,
                pile.pile_type,
                pile.diameter_mm,
                pile.design_length_m,
                pile.actual_length_m,
                steel_kg,
                steel_tons,
                concrete_m3,
                main_bars_kg,
                helix_kg,
                stiffeners_kg,
            ]
        )

    return rows


def get_boq_csv_header() -> list[str]:
    """Return the fixed CSV header used by boq_csv()."""

    return list(_BOQ_CSV_HEADER)
