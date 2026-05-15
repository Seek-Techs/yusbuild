import csv
from typing import Any

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.piles.models import Pile, Project


def validate_pile_row(row: dict[str, Any]) -> tuple[bool, dict[str, str]]:
    errors = {}
    required_fields = [
        "pile_no",
        "pile_type",
        "diameter_mm",
        "design_length_m",
        "actual_length_m",
        "project_id",
    ]
    for field in required_fields:
        if not row.get(field):
            errors[field] = "Missing required field"
    # Add more validation as needed
    return (len(errors) == 0, errors)


def import_pile_schedule_csv(
    file, dry_run: bool = False
) -> tuple[list[Pile], list[dict[str, Any]]]:
    """
    Import pile schedule from a CSV file.
    Returns (created_piles, row_errors)
    """
    reader = csv.DictReader(file)
    created_piles = []
    row_errors = []
    with transaction.atomic():
        for idx, row in enumerate(reader, start=2):  # header is line 1
            valid, errors = validate_pile_row(row)
            if not valid:
                row_errors.append({"row": idx, "errors": errors, "data": row})
                continue
            try:
                project = Project.objects.get(id=row["project_id"])
                pile = Pile(
                    project=project,
                    pile_no=row["pile_no"],
                    pile_type=row["pile_type"],
                    diameter_mm=int(row["diameter_mm"]),
                    design_length_m=float(row["design_length_m"]),
                    actual_length_m=float(row["actual_length_m"]),
                )
                pile.full_clean()
                if not dry_run:
                    pile.save()
                created_piles.append(pile)
            except (Project.DoesNotExist, ValidationError, ValueError) as e:
                row_errors.append(
                    {"row": idx, "errors": {"exception": str(e)}, "data": row}
                )
        if dry_run or row_errors:
            transaction.set_rollback(True)
    return created_piles, row_errors
