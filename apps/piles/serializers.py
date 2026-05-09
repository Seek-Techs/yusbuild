"""
DRF Serializers for the Piles app.
"""

import logging
from rest_framework import serializers
from apps.piles.models import Pile, PileTypeConfiguration, PileCalculation
from apps.piles.calculations import PileCalculator

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


# ============================================================
# Pile Serializers
# ============================================================

class PileSummarySerializer(serializers.ModelSerializer):
    """Lightweight pile serializer for list views."""

    steel_kg = serializers.FloatField(source="calculation.total_steel_kg", read_only=True)
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
        # Ensure actual_length >= design_length (or warn)
        design_length = data.get("design_length_m")
        actual_length = data.get("actual_length_m")

        if design_length and actual_length:
            if actual_length < design_length:
                # This is a warning case, not necessarily an error
                logger.warning(
                    "Pile actual length (%.1fm) is less than design length (%.1fm)",
                    actual_length,
                    design_length,
                )

        # Validate pile_no uniqueness within project
        project = data.get("project")
        pile_no = data.get("pile_no")
        if project and pile_no:
            instance = getattr(self, "instance", None)
            queryset = Pile.objects.filter(project=project, pile_no=pile_no)
            if instance:
                queryset = queryset.exclude(pk=instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    {"pile_no": f"Pile '{pile_no}' already exists in this project."}
                )

        return data

    def create(self, validated_data):
        """Create pile and run calculation."""
        pile = Pile.objects.create(**validated_data)
        logger.info("Pile created: %s (project=%s)", pile.pile_no, pile.project.name)

        # Run calculation
        self._run_calculation(pile)

        return pile

    def update(self, instance, validated_data):
        """Update pile and recalculate if needed."""
        # Check if recalculation is needed
        recalculate_fields = ["pile_type", "diameter_mm", "design_length_m", "actual_length_m"]
        needs_recalc = any(
            field in validated_data and validated_data[field] != getattr(instance, field)
            for field in recalculate_fields
        )

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        logger.info("Pile updated: %s (recalculate=%s)", instance.pile_no, needs_recalc)

        if needs_recalc:
            self._run_calculation(instance)

        return instance

    def _run_calculation(self, pile: Pile):
        """Run calculation engine and store results."""
        try:
            result = PileCalculator.calculate(pile)

            # Store calculation results
            PileCalculation.objects.update_or_create(
                pile=pile,
                defaults={
                    "main_bars_kg": result.main_bars_kg,
                    "helix_kg": result.helix_kg,
                    "stiffeners_kg": result.stiffeners_kg,
                    "total_steel_kg": result.total_steel_kg,
                    "design_concrete_m3": result.design_concrete_m3,
                    "actual_concrete_m3": result.actual_concrete_m3,
                    "calculation_version": "1.0.0",
                },
            )

            # Attach result to serializer context for response
            self._calculation_result = result.to_dict()
            logger.info("Calculation stored for pile %s", pile.pile_no)

        except ValueError as exc:
            logger.error("Calculation failed for pile %s: %s", pile.pile_no, str(exc))
            raise serializers.ValidationError({"calculation": str(exc)})
        except Exception as exc:
            logger.critical(
                "Unexpected calculation error for pile %s: %s",
                pile.pile_no,
                str(exc),
                exc_info=True,
            )
            raise serializers.ValidationError(
                {"calculation": "An unexpected error occurred during calculation."}
            )

    def to_representation(self, instance):
        """Include calculation result in response."""
        data = super().to_representation(instance)

        # Add full calculation breakdown
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
