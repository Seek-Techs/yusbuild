from dataclasses import dataclass

from apps.approvals.models import ApprovalDecisionType
from apps.execution.models import ExecutionRecordState, ExecutionRecordVersion
from apps.piles.calculations import PileCalculator
from apps.piles.models import PileTypeConfiguration
from apps.verification.models import (
    VarianceCategory,
    VarianceFlag,
    VarianceSeverity,
)

OVERDEPTH_THRESHOLD_M = 1.0
CONCRETE_TOLERANCE_RATIO = 0.10
MIN_REASONABLE_PENETRATION_MM = 0.01


@dataclass(frozen=True)
class RuleContext:
    version: ExecutionRecordVersion
    project: object
    pile: object
    snapshot: dict

    @property
    def driving_record(self) -> dict:
        return self.snapshot.get("pile_driving_record", {})

    @property
    def resistance_logs(self) -> list[dict]:
        return self.snapshot.get("driving_resistance_logs", [])


def build_context(version: ExecutionRecordVersion) -> RuleContext:
    version = ExecutionRecordVersion.objects.select_related(
        "execution_record__project",
        "execution_record__pile",
    ).get(pk=version.pk)
    record = version.execution_record
    return RuleContext(
        version=version,
        project=record.project,
        pile=record.pile,
        snapshot=version.data_snapshot,
    )


def _value(value) -> str:
    if value is None:
        return ""
    if isinstance(value, float):
        return f"{value:.6g}"
    return str(value)


def _create_flag(
    context: RuleContext,
    *,
    category: str,
    severity: str,
    rule_code: str,
    message: str,
    expected_value="",
    reported_value="",
    verified_value="",
):
    flag, _ = VarianceFlag.objects.get_or_create(
        execution_record_version=context.version,
        rule_code=rule_code,
        defaults={
            "project": context.project,
            "pile": context.pile,
            "category": category,
            "severity": severity,
            "expected_value": _value(expected_value),
            "reported_value": _value(reported_value),
            "verified_value": _value(verified_value),
            "message": message,
        },
    )
    return flag


def _has_evidence(context: RuleContext, *, evidence_type: str | None = None) -> bool:
    links = context.version.evidence_links.filter(evidence__is_deleted=False)
    if evidence_type:
        links = links.filter(evidence__evidence_type=evidence_type)
    return links.exists()


def _has_named_evidence(context: RuleContext, keyword: str) -> bool:
    return context.version.evidence_links.filter(
        evidence__is_deleted=False,
        evidence__original_filename__icontains=keyword,
    ).exists()


def run_depth_checks(context: RuleContext) -> list[VarianceFlag]:
    flags = []
    design_depth = context.pile.design_length_m
    reported_depth = context.driving_record.get("reported_depth_m")
    verified_depth = context.driving_record.get("verified_depth_m")
    actual_depth = verified_depth if verified_depth is not None else reported_depth

    if actual_depth is not None and float(actual_depth) < design_depth:
        flags.append(
            _create_flag(
                context,
                category=VarianceCategory.DEPTH,
                severity=VarianceSeverity.CRITICAL,
                rule_code="DEPTH_BELOW_DESIGN",
                message="Installed depth is below design depth.",
                expected_value=design_depth,
                reported_value=reported_depth,
                verified_value=verified_depth,
            )
        )

    if actual_depth is not None and float(actual_depth) > (
        design_depth + OVERDEPTH_THRESHOLD_M
    ):
        flags.append(
            _create_flag(
                context,
                category=VarianceCategory.DEPTH,
                severity=VarianceSeverity.WARNING,
                rule_code="DEPTH_EXCESSIVE_OVERDEPTH",
                message="Installed depth exceeds the overdepth threshold.",
                expected_value=design_depth + OVERDEPTH_THRESHOLD_M,
                reported_value=reported_depth,
                verified_value=verified_depth,
            )
        )
    return flags


def run_concrete_checks(context: RuleContext) -> list[VarianceFlag]:
    flags = []
    reported_depth = context.driving_record.get("reported_depth_m")
    if reported_depth is not None:
        theoretical = PileCalculator.calculate_concrete(
            context.pile.diameter_mm,
            context.pile.design_length_m,
            float(reported_depth),
        ).actual_volume_m3
        actual = getattr(context.pile, "calculation", None)
        recorded = actual.actual_concrete_m3 if actual else None
        if recorded is not None:
            tolerance = theoretical * CONCRETE_TOLERANCE_RATIO
            if abs(recorded - theoretical) > tolerance:
                flags.append(
                    _create_flag(
                        context,
                        category=VarianceCategory.CONCRETE,
                        severity=VarianceSeverity.WARNING,
                        rule_code="CONCRETE_OUTSIDE_TOLERANCE",
                        message=(
                            "Recorded concrete volume differs from theoretical "
                            "volume."
                        ),
                        expected_value=f"{theoretical:.6f} +/- {tolerance:.6f}",
                        reported_value=recorded,
                    )
                )

    if not _has_named_evidence(context, "concrete"):
        flags.append(
            _create_flag(
                context,
                category=VarianceCategory.CONCRETE,
                severity=VarianceSeverity.WARNING,
                rule_code="CONCRETE_MISSING_EVIDENCE",
                message="Concrete evidence has not been linked to this version.",
                expected_value="concrete evidence",
                reported_value="missing",
            )
        )
    return flags


def run_reinforcement_checks(context: RuleContext) -> list[VarianceFlag]:
    flags = []
    config_type = (
        "TYPE_I" if context.pile.pile_type == "BORED" else context.pile.pile_type
    )
    if not PileTypeConfiguration.objects.filter(
        pile_type=config_type,
        is_active=True,
    ).exists():
        flags.append(
            _create_flag(
                context,
                category=VarianceCategory.REINFORCEMENT,
                severity=VarianceSeverity.CRITICAL,
                rule_code="REINFORCEMENT_CONFIG_MISMATCH",
                message="No active reinforcement configuration matches the pile type.",
                expected_value=config_type,
                reported_value="missing",
            )
        )

    if not _has_named_evidence(context, "reinforcement"):
        flags.append(
            _create_flag(
                context,
                category=VarianceCategory.REINFORCEMENT,
                severity=VarianceSeverity.WARNING,
                rule_code="REINFORCEMENT_MISSING_INSPECTION",
                message="Reinforcement inspection evidence has not been linked.",
                expected_value="reinforcement inspection",
                reported_value="missing",
            )
        )
    return flags


def run_evidence_checks(context: RuleContext) -> list[VarianceFlag]:
    flags = []
    if (
        context.version.execution_record.current_state == ExecutionRecordState.APPROVED
        and not _has_evidence(context)
    ):
        flags.append(
            _create_flag(
                context,
                category=VarianceCategory.EVIDENCE,
                severity=VarianceSeverity.CRITICAL,
                rule_code="EVIDENCE_MISSING_FOR_APPROVED",
                message="Approved records must have linked evidence.",
                expected_value="linked evidence",
                reported_value="missing",
            )
        )

    duplicate_hashes = (
        context.version.evidence_links.filter(evidence__is_deleted=False)
        .values_list("evidence__sha256_hash", flat=True)
        .order_by("evidence__sha256_hash")
    )
    seen = set()
    duplicates = []
    for sha256_hash in duplicate_hashes:
        if sha256_hash in seen:
            duplicates.append(sha256_hash)
        seen.add(sha256_hash)
    if duplicates:
        flags.append(
            _create_flag(
                context,
                category=VarianceCategory.EVIDENCE,
                severity=VarianceSeverity.WARNING,
                rule_code="EVIDENCE_DUPLICATE_HASH",
                message="Duplicate evidence hashes are linked to this version.",
                expected_value="unique hashes",
                reported_value=",".join(sorted(set(duplicates))),
            )
        )
    return flags


def run_approval_checks(context: RuleContext) -> list[VarianceFlag]:
    flags = []
    approved_decision_exists = context.version.approval_decisions.filter(
        decision__in=[
            ApprovalDecisionType.APPROVE,
            ApprovalDecisionType.APPROVE_WITH_COMMENTS,
        ]
    ).exists()

    if (
        context.version.execution_record.current_state == ExecutionRecordState.APPROVED
        and not approved_decision_exists
    ):
        flags.append(
            _create_flag(
                context,
                category=VarianceCategory.APPROVAL,
                severity=VarianceSeverity.CRITICAL,
                rule_code="APPROVAL_MISSING_DECISION",
                message="Record is approved without a consultant approval decision.",
                expected_value="approval decision",
                reported_value="missing",
            )
        )

    if (
        context.version.execution_record.current_state == ExecutionRecordState.CERTIFIED
        and not approved_decision_exists
    ):
        flags.append(
            _create_flag(
                context,
                category=VarianceCategory.APPROVAL,
                severity=VarianceSeverity.CRITICAL,
                rule_code="CERTIFICATION_WITHOUT_APPROVAL",
                message="Certification state requires prior consultant approval.",
                expected_value="approval before certification",
                reported_value="missing",
            )
        )
    return flags


def run_blow_count_checks(context: RuleContext) -> list[VarianceFlag]:
    flags = []
    final_set = context.driving_record.get("final_set", "")
    if not final_set:
        flags.append(
            _create_flag(
                context,
                category=VarianceCategory.BLOW_COUNT,
                severity=VarianceSeverity.WARNING,
                rule_code="BLOW_COUNT_MISSING_FINAL_SET",
                message="Final set is missing from the driving record.",
                expected_value="final set",
                reported_value="missing",
            )
        )

    previous_depth_to = None
    repeated_values = {}
    impossible_progression = False
    for log in context.resistance_logs:
        depth_from = float(log.get("depth_from_m") or 0)
        depth_to = float(log.get("depth_to_m") or 0)
        penetration = float(log.get("penetration_mm") or 0)
        blow_count = int(log.get("blow_count") or 0)
        key = (penetration, blow_count)
        repeated_values[key] = repeated_values.get(key, 0) + 1
        if depth_to < depth_from or penetration < MIN_REASONABLE_PENETRATION_MM:
            impossible_progression = True
        if previous_depth_to is not None and depth_from < previous_depth_to:
            impossible_progression = True
        previous_depth_to = depth_to

    if impossible_progression:
        flags.append(
            _create_flag(
                context,
                category=VarianceCategory.BLOW_COUNT,
                severity=VarianceSeverity.CRITICAL,
                rule_code="BLOW_COUNT_IMPOSSIBLE_PROGRESSION",
                message=(
                    "Resistance log depth or penetration progression is "
                    "impossible."
                ),
                expected_value="monotonic depth and positive penetration",
                reported_value="invalid progression",
            )
        )

    if any(count >= 3 for count in repeated_values.values()):
        flags.append(
            _create_flag(
                context,
                category=VarianceCategory.BLOW_COUNT,
                severity=VarianceSeverity.WARNING,
                rule_code="BLOW_COUNT_REPEATED_VALUES",
                message="Resistance logs contain repeated suspicious values.",
                expected_value="varied field readings",
                reported_value="repeated penetration/blow count",
            )
        )
    return flags
