"""
Django Admin configuration for Piles app.
"""

from django.contrib import admin
from apps.piles.models import (
    Pile,
    PileTypeConfiguration,
    PileCalculation,
    PileCalculationHistory,
)


@admin.register(PileTypeConfiguration)
class PileTypeConfigurationAdmin(admin.ModelAdmin):
    list_display = [
        "pile_type",
        "version",
        "is_active",
        "helix_bar_size_mm",
        "helix_pitch_mm",
        "stiffener_bar_size_mm",
        "created_at",
    ]
    list_filter = ["pile_type", "is_active"]
    search_fields = ["pile_type", "description"]


@admin.register(Pile)
class PileAdmin(admin.ModelAdmin):
    list_display = [
        "pile_no",
        "pile_type",
        "project",
        "diameter_mm",
        "design_length_m",
        "actual_length_m",
        "created_at",
    ]
    list_filter = ["pile_type", "diameter_mm", "created_at"]
    search_fields = ["pile_no", "location_on_site", "notes"]
    list_select_related = ["project"]


@admin.register(PileCalculation)
class PileCalculationAdmin(admin.ModelAdmin):
    list_display = [
        "pile",
        "total_steel_kg",
        "main_bars_kg",
        "helix_kg",
        "stiffeners_kg",
        "actual_concrete_m3",
        "calculated_at",
    ]
    list_filter = ["calculated_at"]
    readonly_fields = ["calculated_at"]


@admin.register(PileCalculationHistory)
class PileCalculationHistoryAdmin(admin.ModelAdmin):
    list_display = [
        "pile",
        "trigger",
        "triggered_by",
        "calculation_version",
        "config_version",
        "created_at",
    ]
    list_filter = ["trigger", "calculation_version", "config_version", "created_at"]
    search_fields = ["pile__pile_no", "triggered_by__username", "reason"]
    readonly_fields = [
        "pile",
        "calculation",
        "triggered_by",
        "trigger",
        "reason",
        "calculation_version",
        "config_version",
        "input_snapshot",
        "config_snapshot",
        "constants_snapshot",
        "result_snapshot",
        "created_at",
    ]
