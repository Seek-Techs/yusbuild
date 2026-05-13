"""
Project model for YusBuild.
A Project contains multiple piles and aggregates BOQ data.
"""

import logging

from django.conf import settings
from django.core.validators import MinLengthValidator
from django.db import models

logger = logging.getLogger(__name__)


class ProjectStatus(models.TextChoices):
    """Project lifecycle statuses."""

    ACTIVE = "ACTIVE", "Active"
    ON_HOLD = "ON_HOLD", "On Hold"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"


class Project(models.Model):
    """
    A construction project containing piles.

    Example: 'Lekki Phase 1', 'Bridge Project', 'Warehouse Project'
    """

    name = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(2)],
        help_text="Project name, e.g., 'Lekki Phase 1'",
    )
    location = models.CharField(
        max_length=300,
        blank=True,
        help_text="Project location, e.g., 'Lekki, Lagos'",
    )
    client = models.CharField(
        max_length=200,
        blank=True,
        help_text="Client name",
    )
    description = models.TextField(
        blank=True,
        help_text="Project description",
    )
    status = models.CharField(
        max_length=20,
        choices=ProjectStatus.choices,
        default=ProjectStatus.ACTIVE,
        db_index=True,
    )
    created_by = models.CharField(
        max_length=100,
        blank=True,
        help_text="Name of engineer who created the project",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        db_table = "projects"
        verbose_name = "Project"
        verbose_name_plural = "Projects"

    def __str__(self) -> str:
        return f"{self.name} ({self.status})"

    @property
    def total_piles(self) -> int:
        """Return total number of piles in the project."""
        return self.piles.count()

    @property
    def total_steel_kg(self) -> float:
        """Return total steel weight across all piles (kg)."""
        from django.db.models import Sum

        result = self.piles.aggregate(total=Sum("calculation__total_steel_kg"))
        return result["total"] or 0.0

    @property
    def total_concrete_m3(self) -> float:
        """Return total concrete volume across all piles (m3)."""
        from django.db.models import Sum

        result = self.piles.aggregate(total=Sum("calculation__actual_concrete_m3"))
        return result["total"] or 0.0


class ProjectMembership(models.Model):
    """User access assignment for a project."""

    ROLE_ADMIN = "admin"
    ROLE_ENGINEER = "engineer"
    ROLE_VIEWER = "viewer"

    ROLE_CHOICES = [
        (ROLE_ADMIN, "Admin"),
        (ROLE_ENGINEER, "Engineer"),
        (ROLE_VIEWER, "Viewer"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_memberships",
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=ROLE_ENGINEER,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "project_memberships"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "user"],
                name="unique_project_membership",
            )
        ]
        indexes = [
            models.Index(fields=["user", "role"]),
            models.Index(fields=["project", "role"]),
        ]

    def __str__(self) -> str:
        return f"{self.user} -> {self.project} ({self.role})"
