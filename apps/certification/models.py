from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from apps.execution.models import ExecutionRecordVersion
from apps.piles.models import Pile
from apps.projects.models import Project


class CertificationPackageState(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SUBMITTED = "SUBMITTED", "Submitted"
    APPROVED = "APPROVED", "Approved"
    CERTIFIED = "CERTIFIED", "Certified"
    LOCKED = "LOCKED", "Locked"


class CertificationPackage(models.Model):
    """Workflow header for a group of quantities ready for certification."""

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="certification_packages",
    )
    package_no = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    current_state = models.CharField(
        max_length=40,
        choices=CertificationPackageState.choices,
        default=CertificationPackageState.DRAFT,
        db_index=True,
    )
    quantity_snapshot = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_certification_packages",
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_certification_packages",
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_certification_packages",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    certified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="certified_certification_packages",
    )
    certified_at = models.DateTimeField(null=True, blank=True)
    locked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "certification_packages"
        ordering = ["-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "package_no"],
                name="unique_certification_package_no_per_project",
            )
        ]
        indexes = [
            models.Index(fields=["project", "current_state"]),
            models.Index(fields=["package_no"]),
        ]

    @property
    def is_editable(self) -> bool:
        return self.current_state == CertificationPackageState.DRAFT

    def save(self, *args, **kwargs):
        if self.pk:
            existing = CertificationPackage.objects.get(pk=self.pk)
            if existing.current_state in {
                CertificationPackageState.CERTIFIED,
                CertificationPackageState.LOCKED,
            }:
                mutable_system_fields = {
                    "current_state",
                    "locked_at",
                    "updated_at",
                }
                changed_fields = {
                    field.name
                    for field in self._meta.fields
                    if getattr(existing, field.name) != getattr(self, field.name)
                }
                if changed_fields - mutable_system_fields:
                    raise ValidationError("Certified packages are immutable.")
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.package_no} ({self.current_state})"


class CertificationLine(models.Model):
    """Draft-to-approved line item referencing an approved execution version."""

    package = models.ForeignKey(
        CertificationPackage,
        on_delete=models.CASCADE,
        related_name="lines",
    )
    pile = models.ForeignKey(
        Pile,
        on_delete=models.PROTECT,
        related_name="certification_lines",
    )
    source_execution_version = models.ForeignKey(
        ExecutionRecordVersion,
        on_delete=models.PROTECT,
        related_name="certification_lines",
    )
    certified_depth_m = models.FloatField(validators=[MinValueValidator(0)])
    certified_concrete_m3 = models.FloatField(validators=[MinValueValidator(0)])
    certified_reinforcement_kg = models.FloatField(validators=[MinValueValidator(0)])
    quantity_snapshot = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "certification_lines"
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(
                fields=["package", "source_execution_version"],
                name="unique_certification_line_source_version_per_package",
            )
        ]
        indexes = [
            models.Index(fields=["package", "pile"]),
            models.Index(fields=["source_execution_version"]),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            existing = CertificationLine.objects.select_related("package").get(
                pk=self.pk
            )
            if not existing.package.is_editable:
                raise ValidationError("Certification lines are immutable after draft.")
        elif self.package_id:
            package = CertificationPackage.objects.get(pk=self.package_id)
            if not package.is_editable:
                raise ValidationError(
                    "Certification lines can only be added to drafts."
                )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if not self.package.is_editable:
            raise ValidationError("Certification lines are immutable after draft.")
        super().delete(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.package.package_no} - {self.pile.pile_no}"


class CertifiedQuantity(models.Model):
    """Immutable quantity frozen when a package reaches CERTIFIED."""

    package = models.ForeignKey(
        CertificationPackage,
        on_delete=models.PROTECT,
        related_name="certified_quantities",
    )
    certification_line = models.OneToOneField(
        CertificationLine,
        on_delete=models.PROTECT,
        related_name="certified_quantity",
    )
    pile = models.ForeignKey(
        Pile,
        on_delete=models.PROTECT,
        related_name="certified_quantities",
    )
    source_execution_version = models.ForeignKey(
        ExecutionRecordVersion,
        on_delete=models.PROTECT,
        related_name="certified_quantities",
    )
    certified_depth_m = models.FloatField(validators=[MinValueValidator(0)])
    certified_concrete_m3 = models.FloatField(validators=[MinValueValidator(0)])
    certified_reinforcement_kg = models.FloatField(validators=[MinValueValidator(0)])
    frozen_snapshot = models.JSONField(default=dict)
    certified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="certified_quantities",
    )
    certified_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = "certified_quantities"
        ordering = ["certified_at", "id"]
        indexes = [
            models.Index(fields=["package", "pile"]),
            models.Index(fields=["source_execution_version"]),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError("Certified quantities are immutable.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Certified quantities cannot be deleted.")

    def __str__(self) -> str:
        return f"Certified quantity for {self.pile.pile_no}"
