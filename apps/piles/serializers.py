"""
DRF Serializers for the Piles app.
"""

import logging

from django.db import transaction
from rest_framework import serializers

from apps.piles.calculations import PileCalculator
from apps.piles.models import (
    Pile,
    PileCalculation,
    PileCalculationHistory,
    PileTypeConfiguration,
)
from apps.piles.services import calculate_and_persist_pile
from apps.projects.models import ProjectMembership

logger = logging.getLogger(__name__)


# ============================================================
# PileTypeConfiguration Serializers
# ============================================================


class PileTypeConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for pile type configuration."""

    class Meta:
        model = PileTypeConfiguration
        fields = [
            "id",
            "pile_type",
            "description",
            "main_bar_sections",
            "lap_length_m",
            "helix_bar_size_mm",
            "helix_pitch_mm",
            "cage_diameter_mm",
            "helix_end_turns",
            "stiffener_bar_size_mm",
            "stiffener_ring_diameter_mm",
            "stiffener_spacing_m",
            "concrete_cover_mm",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def validate_main_bar_sections(self, value):
        """Validate main bar section JSON structure."""
        if not isinstance(value, list) or not value:
            raise serializers.ValidationError(
                "main_bar_sections must be a non-empty list."
            )

        required_fields = {
            "bar_size",
            "length_per_bar_m",
            "count",
            "section_name",
        }

        valid_bar_sizes = {6, 8, 10, 12, 16, 20, 25, 28, 32, 40}

        for index, section in enumerate(value):
            if not isinstance(section, dict):
                raise serializers.ValidationError(f"Section {index} must be an object.")

            missing_fields = required_fields - section.keys()
            if missing_fields:
                missing = ", ".join(sorted(missing_fields))
                raise serializers.ValidationError(
                    f"Section {index} is missing required field(s): {missing}."
                )

            try:
                bar_size = int(section["bar_size"])
                length_per_bar = float(section["length_per_bar_m"])
                count = int(section["count"])
            except (TypeError, ValueError) as err:
                raise serializers.ValidationError(
                    f"Section {index} has invalid numeric values."
                ) from err

            if bar_size not in valid_bar_sizes:
                raise serializers.ValidationError(
                    f"Section {index} has invalid bar_size {bar_size}."
                )

            if length_per_bar <= 0:
                raise serializers.ValidationError(
                    f"Section {index} length_per_bar_m must be greater than zero."
                )

            if count <= 0:
                raise serializers.ValidationError(
                    f"Section {index} count must be greater than zero."
                )

            if not str(section["section_name"]).strip():
                raise serializers.ValidationError(
                    f"Section {index} section_name must not be blank."
                )

        return value


# ============================================================
# PileCalculation Serializers
# ============================================================


class PileCalculationSerializer(serializers.ModelSerializer):
    """Serializer for calculated pile results."""

    total_tons = serializers.SerializerMethodField()

    class Meta:
        model = PileCalculation
        fields = [
            "main_bars_kg",
            "helix_kg",
            "stiffeners_kg",
            "total_steel_kg",
            "total_tons",
            "design_concrete_m3",
            "actual_concrete_m3",
            "calculation_version",
            "calculated_at",
        ]

    def get_total_tons(self, obj: PileCalculation) -> float:
        """Convert kg to metric tons."""
        return round(obj.total_steel_kg / 1000, 3)


class PileCalculationHistorySerializer(serializers.ModelSerializer):
    """Serializer for immutable calculation audit records."""

    triggered_by_username = serializers.CharField(
        source="triggered_by.username",
        read_only=True,
    )

    class Meta:
        model = PileCalculationHistory
        fields = [
            "id",
            "trigger",
            "reason",
            "triggered_by",
            "triggered_by_username",
            "calculation_version",
            "config_version",
            "input_snapshot",
            "config_snapshot",
            "constants_snapshot",
            "result_snapshot",
            "created_at",
        ]
        read_only_fields = fields


# ============================================================
# Pile Serializers
# ============================================================


class PileSummarySerializer(serializers.ModelSerializer):
    """Lightweight pile serializer for list views."""

    steel_kg = serializers.FloatField(
        source="calculation.total_steel_kg", read_only=True
    )
    steel_tons = serializers.SerializerMethodField()
    concrete_m3 = serializers.FloatField(
        source="calculation.actual_concrete_m3", read_only=True
    )

    class Meta:
        model = Pile
        fields = [
            "id",
            "pile_no",
            "pile_type",
            "diameter_mm",
            "design_length_m",
            "actual_length_m",
            "steel_kg",
            "steel_tons",
            "concrete_m3",
            "created_at",
        ]

    def get_steel_tons(self, obj: Pile) -> float:
        """Convert kg to metric tons."""
        if hasattr(obj, "calculation") and obj.calculation:
            return round(obj.calculation.total_steel_kg / 1000, 2)
        return 0.0


class PileDetailSerializer(serializers.ModelSerializer):
    """Full pile serializer with calculation breakdown."""

    calculation = PileCalculationSerializer(read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)

    class Meta:
        model = Pile
        fields = [
            "id",
            "pile_no",
            "pile_type",
            "project",
            "project_name",
            "diameter_mm",
            "design_length_m",
            "actual_length_m",
            "piling_method",
            "concrete_grade",
            "location_on_site",
            "drawing_reference",
            "date_installed",
            "notes",
            "calculation",
            "created_at",
            "updated_at",
        ]


class PileCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating piles with auto-calculation.

    On create: automatically runs calculation engine and stores results.
    On update: recalculates if pile_type, diameter, or lengths change.
    """

    calculation_result = serializers.DictField(read_only=True)

    class Meta:
        model = Pile
        fields = [
            "id",
            "pile_no",
            "pile_type",
            "project",
            "diameter_mm",
            "design_length_m",
            "actual_length_m",
            "piling_method",
            "concrete_grade",
            "location_on_site",
            "drawing_reference",
            "date_installed",
            "notes",
            "calculation_result",
        ]
        read_only_fields = ["id"]

    def validate(self, data):
        """Validate pile data."""

        instance = getattr(self, "instance", None)
        pile_type = data.get("pile_type", getattr(instance, "pile_type", None))

        # Validate pile type configuration exists
        if not PileTypeConfiguration.objects.filter(
            pile_type=pile_type,
            is_active=True,
        ).exists():
            raise serializers.ValidationError(
                {"pile_type": f"No active configuration exists for {pile_type}"}
            )

        # Validate lengths
        design_length = data.get(
            "design_length_m",
            getattr(instance, "design_length_m", None),
        )
        actual_length = data.get(
            "actual_length_m",
            getattr(instance, "actual_length_m", None),
        )

        if design_length is not None and actual_length is not None:
            # Prevent impossible values
            if design_length <= 0:
                raise serializers.ValidationError(
                    {"design_length_m": "Design length must be greater than zero."}
                )

            if actual_length <= 0:
                raise serializers.ValidationError(
                    {"actual_length_m": "Actual length must be greater than zero."}
                )

            # Warning log only
            if actual_length < design_length:
                logger.warning(
                    "Pile actual length (%.1fm) is less than design length (%.1fm)",
                    actual_length,
                    design_length,
                )

        # Validate pile_no uniqueness within project
        project = data.get("project", getattr(self.instance, "project", None))
        pile_no = data.get("pile_no", getattr(self.instance, "pile_no", None))

        request = self.context.get("request")
        if request and project:
            user = request.user
            user_groups = set(user.groups.values_list("name", flat=True))
            can_write_project = (
                user.is_superuser
                or "admin" in user_groups
                or ProjectMembership.objects.filter(
                    project=project,
                    user=user,
                    role__in=[
                        ProjectMembership.ROLE_ADMIN,
                        ProjectMembership.ROLE_ENGINEER,
                    ],
                ).exists()
            )
            if not can_write_project:
                raise serializers.ValidationError(
                    {"project": "You do not have write access to this project."}
                )

        if pile_no is not None:
            pile_no = pile_no.strip()
            data["pile_no"] = pile_no

        if project and pile_no:
            queryset = Pile.objects.filter(
                project=project,
                pile_no__iexact=pile_no,
            )

            if instance:
                queryset = queryset.exclude(pk=instance.pk)

            if queryset.exists():
                raise serializers.ValidationError(
                    {"pile_no": f"Pile '{pile_no}' already exists in this project."}
                )

        return data

    @transaction.atomic
    def create(self, validated_data):
        """Create pile and run calculation atomically."""
        pile = Pile.objects.create(**validated_data)
        logger.info("Pile created: %s (project=%s)", pile.pile_no, pile.project.name)

        request = self.context.get("request")
        self._run_calculation(
            pile,
            triggered_by=getattr(request, "user", None),
            trigger="create",
            reason="Pile created",
        )

        return pile

    @transaction.atomic
    def update(self, instance, validated_data):
        """Update pile and recalculate atomically when quantity inputs change."""
        recalculate_fields = [
            "pile_type",
            "diameter_mm",
            "design_length_m",
            "actual_length_m",
        ]
        needs_recalc = any(
            field in validated_data
            and validated_data[field] != getattr(instance, field)
            for field in recalculate_fields
        )

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        logger.info("Pile updated: %s (recalculate=%s)", instance.pile_no, needs_recalc)

        if needs_recalc:
            request = self.context.get("request")
            self._run_calculation(
                instance,
                triggered_by=getattr(request, "user", None),
                trigger="update",
                reason="Pile quantity inputs updated",
            )

        return instance

    def _run_calculation(
        self,
        pile: Pile,
        *,
        triggered_by=None,
        trigger="recalculate",
        reason="",
    ):
        """Run calculation engine and store results."""
        try:
            calculation, history, result = calculate_and_persist_pile(
                pile=pile,
                triggered_by=triggered_by,
                trigger=trigger,
                reason=reason,
            )

            # Attach result to serializer context for response
            self._calculation_result = result.to_dict()
            logger.info(
                "Calculation stored for pile %s (history_id=%s)",
                pile.pile_no,
                history.id,
            )

        except ValueError as exc:
            logger.error("Calculation failed for pile %s: %s", pile.pile_no, str(exc))
            raise serializers.ValidationError({"calculation": str(exc)}) from exc
        except Exception as exc:
            logger.critical(
                "Unexpected calculation error for pile %s: %s",
                pile.pile_no,
                str(exc),
                exc_info=True,
            )
            raise serializers.ValidationError(
                {"calculation": "An unexpected error occurred during calculation."}
            ) from exc

    def to_representation(self, instance):
        """Include calculation result in response."""
        data = super().to_representation(instance)

        calculation_result = getattr(self, "_calculation_result", None)
        if calculation_result is not None:
            data["calculation_result"] = calculation_result
            return data

        try:
            result = PileCalculator.calculate(instance)
            data["calculation_result"] = result.to_dict()
        except Exception as exc:
            logger.warning("Could not include calculation in response: %s", str(exc))
            data["calculation_result"] = None

        return data


class PileListFilterSerializer(serializers.Serializer):
    """Serializer for validating pile list query parameters."""

    pile_type = serializers.ChoiceField(
        choices=Pile.PILE_TYPE_CHOICES,
        required=False,
    )
    project = serializers.IntegerField(required=False, min_value=1)
    min_steel_kg = serializers.FloatField(required=False, min_value=0)
    max_steel_kg = serializers.FloatField(required=False, min_value=0)
    search = serializers.CharField(required=False, allow_blank=True)
    ordering = serializers.ChoiceField(
        choices=[
            "pile_no",
            "-pile_no",
            "created_at",
            "-created_at",
            "design_length_m",
            "-design_length_m",
        ],
        required=False,
        default="pile_no",
    )
