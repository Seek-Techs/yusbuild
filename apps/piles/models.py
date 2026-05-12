"""
Pile models for YusBuild.
Core domain: Pile, PileTypeConfiguration, PileCalculation.
"""

import logging
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.projects.models import Project

logger = logging.getLogger(__name__)


class PileTypeConfiguration(models.Model):
    """
    Pre-configured reinforcement template for a pile type.

    Each pile type (I, II, III) has a specific reinforcement layout
    defined by the structural engineer. This model stores those
    constants so calculations are data-driven, not hardcoded.

    Reverse-engineered from TECON Construction Excel sheets.
    """

    PILE_TYPE_CHOICES = [
        ("TYPE_I", "Type I"),
        ("TYPE_II", "Type II"),
        ("TYPE_III", "Type III"),
    ]

    pile_type = models.CharField(
        max_length=20,
        choices=PILE_TYPE_CHOICES,
        unique=True,
        db_index=True,
        help_text="Pile type identifier",
    )
    description = models.TextField(
        blank=True,
        help_text="Description of this pile type configuration",
    )

    # -- Main Bar Configuration (JSON for flexibility) --
    # Format: [{"bar_size": 16, "length_per_bar_m": 15.78, "count": 10, "section_name": "full_cage"}, ...]
    main_bar_sections = models.JSONField(
        default=list,
        help_text="List of main bar sections with size, length, count",
    )
    lap_length_m = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0)],
        help_text="Lap length in meters",
    )

    # -- Helix/Spiral Configuration --
    helix_bar_size_mm = models.PositiveIntegerField(
        default=8,
        help_text="Helix/spiral bar diameter in mm (e.g., 8 for Y8)",
    )
    helix_pitch_mm = models.PositiveIntegerField(
        default=250,
        help_text="Helix pitch/spacing in mm",
    )
    cage_diameter_mm = models.PositiveIntegerField(
        default=480,
        help_text="Reinforcement cage diameter in mm",
    )
    helix_end_turns = models.PositiveIntegerField(
        default=8,
        help_text="Extra end turns beyond design_length/pitch",
    )

    # -- Stiffener Configuration --
    stiffener_bar_size_mm = models.PositiveIntegerField(
        default=16,
        help_text="Stiffener ring bar diameter in mm",
    )
    stiffener_ring_diameter_mm = models.FloatField(
        default=543.6,
        help_text="Stiffener ring centerline diameter in mm",
    )
    stiffener_spacing_m = models.FloatField(
        default=2.5,
        validators=[MinValueValidator(0.1)],
        help_text="Stiffener spacing along pile length in meters",
    )

    # -- General --
    concrete_cover_mm = models.PositiveIntegerField(
        default=20,
        help_text="Concrete cover to reinforcement in mm",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this configuration is active",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pile_type_configurations"
        verbose_name = "Pile Type Configuration"
        verbose_name_plural = "Pile Type Configurations"
        ordering = ["pile_type"]

    def __str__(self) -> str:
        return f"{self.pile_type} Configuration"


class Pile(models.Model):
    """
    A single pile within a project.

    Stores input parameters. Calculated results are stored in
    the related PileCalculation model.
    """

    PILE_TYPE_CHOICES = [
        ("TYPE_I", "Type I"),
        ("TYPE_II", "Type II"),
        ("TYPE_III", "Type III"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="piles",
        db_index=True,
    )
    pile_no = models.CharField(
        max_length=50,
        help_text="Pile identifier, e.g., 'P-001', 'PILE 1 OF TYPE II'",
    )
    pile_type = models.CharField(
        max_length=20,
        choices=PILE_TYPE_CHOICES,
        db_index=True,
        help_text="Pile type determines reinforcement configuration",
    )

    # -- Geometric Parameters --
    diameter_mm = models.PositiveIntegerField(
        default=500,
        validators=[MinValueValidator(200), MaxValueValidator(2000)],
        help_text="Pile diameter in mm",
    )
    design_length_m = models.FloatField(
        validators=[MinValueValidator(1.0), MaxValueValidator(100.0)],
        help_text="Design length in meters",
    )
    actual_length_m = models.FloatField(
        validators=[MinValueValidator(1.0), MaxValueValidator(100.0)],
        help_text="Actual installed length in meters",
    )

    # -- Construction Data --
    piling_method = models.CharField(
        max_length=100,
        blank=True,
        help_text="Piling method, e.g., 'Driven Cast In-Situ'",
    )
    concrete_grade = models.CharField(
        max_length=20,
        blank=True,
        help_text="Concrete grade, e.g., 'C35/40'",
    )
    location_on_site = models.CharField(
        max_length=200,
        blank=True,
        help_text="Location on site",
    )

    # -- Metadata --
    drawing_reference = models.CharField(
        max_length=100,
        blank=True,
        help_text="Drawing reference number",
    )
    date_installed = models.DateField(
        null=True,
        blank=True,
        help_text="Date of installation",
    )
    notes = models.TextField(
        blank=True,
        help_text="Obstructions, remarks, test results",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "piles"
        ordering = ["pile_no"]
        verbose_name = "Pile"
        verbose_name_plural = "Piles"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "pile_no"],
                name="unique_project_pile",
            )
        ]


    def __str__(self) -> str:
        return f"{self.pile_no} ({self.pile_type})"


class PileCalculation(models.Model):
    """
    Calculated reinforcement quantities for a pile.

    All values are in kg (steel) or m3 (concrete).
    Created/updated automatically when a Pile is saved.
    """

    pile = models.OneToOneField(
        Pile,
        on_delete=models.CASCADE,
        related_name="calculation",
    )

    # -- Steel Breakdown (kg) --
    main_bars_kg = models.FloatField(
        default=0.0,
        help_text="Total main bar weight in kg",
    )
    helix_kg = models.FloatField(
        default=0.0,
        help_text="Total helix/spiral weight in kg",
    )
    stiffeners_kg = models.FloatField(
        default=0.0,
        help_text="Total stiffener ring weight in kg",
    )
    total_steel_kg = models.FloatField(
        default=0.0,
        help_text="Grand total steel weight in kg",
    )

    # -- Concrete (m3) --
    design_concrete_m3 = models.FloatField(
        default=0.0,
        help_text="Concrete volume using design length",
    )
    actual_concrete_m3 = models.FloatField(
        default=0.0,
        help_text="Concrete volume using actual length",
    )

    # -- Calculation Metadata --
    calculation_version = models.CharField(
        max_length=20,
        default="1.0.0",
        help_text="Version of calculation engine used",
    )
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pile_calculations"
        verbose_name = "Pile Calculation"
        verbose_name_plural = "Pile Calculations"

    def __str__(self) -> str:
        return f"Calc for {self.pile.pile_no}: {self.total_steel_kg:.2f} kg"
