import hashlib
import json

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from apps.piles.models import Pile
from apps.projects.models import Project


class ExecutionRecordState(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SUBMITTED = "SUBMITTED", "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    APPROVED = "APPROVED", "Approved"
    RETURNED_FOR_CORRECTION = (
        "RETURNED_FOR_CORRECTION",
        "Returned for Correction",
    )
    REJECTED = "REJECTED", "Rejected"
    CERTIFIED = "CERTIFIED", "Certified"
    LOCKED = "LOCKED", "Locked"


class ExecutionRecordType(models.TextChoices):
    PILE_DRIVING = "PILE_DRIVING", "Pile Driving"


class ExecutionRecord(models.Model):
    """Generic workflow header for execution records."""

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="execution_records",
    )
    pile = models.ForeignKey(
        Pile,
        on_delete=models.CASCADE,
        related_name="execution_records",
    )
    record_type = models.CharField(
        max_length=40,
        choices=ExecutionRecordType.choices,
        default=ExecutionRecordType.PILE_DRIVING,
        db_index=True,
    )
    current_state = models.CharField(
        max_length=40,
        choices=ExecutionRecordState.choices,
        default=ExecutionRecordState.DRAFT,
        db_index=True,
    )
    current_version_no = models.PositiveIntegerField(default=0)
    latest_version = models.ForeignKey(
        "ExecutionRecordVersion",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="+",
    )
    contractor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contracted_execution_records",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_execution_records",
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_execution_records",
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "execution_records"
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["project", "current_state"]),
            models.Index(fields=["pile", "record_type"]),
        ]

    @property
    def is_editable(self) -> bool:
        return self.current_state in {
            ExecutionRecordState.DRAFT,
            ExecutionRecordState.RETURNED_FOR_CORRECTION,
        }

    def mark_submitted(self, actor, latest_version):
        self.current_state = ExecutionRecordState.SUBMITTED
        self.latest_version = latest_version
        self.current_version_no = latest_version.version_no
        self.submitted_by = actor if getattr(actor, "is_authenticated", False) else None
        self.submitted_at = latest_version.submitted_at or timezone.now()

    def __str__(self) -> str:
        return f"{self.record_type} for {self.pile.pile_no} ({self.current_state})"


class ExecutionRecordVersion(models.Model):
    """Immutable submitted execution snapshot."""

    execution_record = models.ForeignKey(
        ExecutionRecord,
        on_delete=models.CASCADE,
        related_name="versions",
    )
    version_no = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="execution_record_versions",
    )
    submitted_at = models.DateTimeField(default=timezone.now, db_index=True)
    data_snapshot = models.JSONField(default=dict)
    source_record_hash = models.CharField(max_length=64, db_index=True)
    supersedes_version = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="superseded_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "execution_record_versions"
        ordering = ["-version_no"]
        constraints = [
            models.UniqueConstraint(
                fields=["execution_record", "version_no"],
                name="unique_execution_record_version",
            )
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError("Execution record versions are immutable.")
        if not self.source_record_hash:
            self.source_record_hash = make_snapshot_hash(self.data_snapshot)
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Execution record versions cannot be deleted.")

    def __str__(self) -> str:
        return f"{self.execution_record_id} v{self.version_no}"


class PileDrivingRecord(models.Model):
    """Driven pile field execution record."""

    execution_record = models.OneToOneField(
        ExecutionRecord,
        on_delete=models.CASCADE,
        related_name="pile_driving_record",
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="pile_driving_records",
    )
    pile = models.ForeignKey(
        Pile,
        on_delete=models.CASCADE,
        related_name="driving_records",
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    reported_depth_m = models.FloatField(validators=[MinValueValidator(0)])
    verified_depth_m = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    hammer_type = models.CharField(max_length=100)
    hammer_energy = models.CharField(max_length=100, blank=True)
    final_set = models.CharField(max_length=100, blank=True)
    total_blows = models.PositiveIntegerField(default=0)
    remarks = models.TextField(blank=True)
    contractor_comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pile_driving_records"
        ordering = ["-start_time", "-id"]
        indexes = [
            models.Index(fields=["project", "start_time"]),
            models.Index(fields=["pile", "start_time"]),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            existing = PileDrivingRecord.objects.select_related(
                "execution_record"
            ).get(pk=self.pk)
            if not existing.execution_record.is_editable:
                raise ValidationError("Submitted execution records are immutable.")
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Driving record for {self.pile.pile_no}"


class DrivingResistanceLog(models.Model):
    """Blow count progression for a pile driving record."""

    driving_record = models.ForeignKey(
        PileDrivingRecord,
        on_delete=models.CASCADE,
        related_name="resistance_logs",
    )
    sequence_no = models.PositiveIntegerField()
    depth_from_m = models.FloatField(validators=[MinValueValidator(0)])
    depth_to_m = models.FloatField(validators=[MinValueValidator(0)])
    penetration_mm = models.FloatField(validators=[MinValueValidator(0)])
    blow_count = models.PositiveIntegerField()
    set_per_blow = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "driving_resistance_logs"
        ordering = ["sequence_no", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["driving_record", "sequence_no"],
                name="unique_driving_record_log_sequence",
            )
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            existing = DrivingResistanceLog.objects.select_related(
                "driving_record__execution_record"
            ).get(pk=self.pk)
            if not existing.driving_record.execution_record.is_editable:
                raise ValidationError("Submitted resistance logs are immutable.")
        elif self.driving_record_id:
            record = PileDrivingRecord.objects.select_related("execution_record").get(
                pk=self.driving_record_id
            )
            if not record.execution_record.is_editable:
                raise ValidationError("Submitted resistance logs are immutable.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if not self.driving_record.execution_record.is_editable:
            raise ValidationError("Submitted resistance logs are immutable.")
        super().delete(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.driving_record_id} log {self.sequence_no}"


def make_snapshot_hash(snapshot: dict) -> str:
    encoded = json.dumps(snapshot, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()
