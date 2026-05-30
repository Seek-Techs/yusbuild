from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.execution.models import ExecutionRecordVersion
from apps.piles.models import Pile
from apps.projects.models import Project


class VarianceCategory(models.TextChoices):
    DEPTH = "depth", "Depth"
    BLOW_COUNT = "blow_count", "Blow Count"
    CONCRETE = "concrete", "Concrete"
    REINFORCEMENT = "reinforcement", "Reinforcement"
    EVIDENCE = "evidence", "Evidence"
    APPROVAL = "approval", "Approval"
    DELAY = "delay", "Delay"


class VarianceSeverity(models.TextChoices):
    INFO = "info", "Info"
    WARNING = "warning", "Warning"
    CRITICAL = "critical", "Critical"


class VarianceStatus(models.TextChoices):
    OPEN = "open", "Open"
    ACKNOWLEDGED = "acknowledged", "Acknowledged"
    RESOLVED = "resolved", "Resolved"
    WAIVED = "waived", "Waived"


class VarianceFlag(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="variance_flags",
    )
    pile = models.ForeignKey(
        Pile,
        on_delete=models.CASCADE,
        related_name="variance_flags",
    )
    execution_record_version = models.ForeignKey(
        ExecutionRecordVersion,
        on_delete=models.PROTECT,
        related_name="variance_flags",
    )
    category = models.CharField(max_length=40, choices=VarianceCategory.choices)
    severity = models.CharField(max_length=40, choices=VarianceSeverity.choices)
    status = models.CharField(
        max_length=40,
        choices=VarianceStatus.choices,
        default=VarianceStatus.OPEN,
        db_index=True,
    )
    expected_value = models.CharField(max_length=255, blank=True)
    reported_value = models.CharField(max_length=255, blank=True)
    verified_value = models.CharField(max_length=255, blank=True)
    message = models.TextField()
    rule_code = models.CharField(max_length=80)
    triggered_at = models.DateTimeField(default=timezone.now, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_variance_flags",
    )
    resolution_comment = models.TextField(blank=True)

    class Meta:
        db_table = "variance_flags"
        ordering = ["-triggered_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["execution_record_version", "rule_code"],
                name="unique_variance_flag_per_version_rule",
            )
        ]
        indexes = [
            models.Index(fields=["project", "status"]),
            models.Index(fields=["pile", "category"]),
            models.Index(fields=["severity", "status"]),
            models.Index(fields=["triggered_at"]),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            existing = VarianceFlag.objects.get(pk=self.pk)
            immutable_fields = [
                "project_id",
                "pile_id",
                "execution_record_version_id",
                "category",
                "severity",
                "expected_value",
                "reported_value",
                "verified_value",
                "message",
                "rule_code",
                "triggered_at",
            ]
            for field in immutable_fields:
                if getattr(existing, field) != getattr(self, field):
                    raise ValidationError(
                        f"Variance flag field '{field}' cannot be changed."
                    )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Variance flags cannot be deleted.")

    def __str__(self) -> str:
        return f"{self.rule_code} for version {self.execution_record_version_id}"


class VerificationActionLog(models.Model):
    variance_flag = models.ForeignKey(
        VarianceFlag,
        on_delete=models.CASCADE,
        related_name="action_logs",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verification_action_logs",
    )
    action = models.CharField(max_length=80, db_index=True)
    previous_status = models.CharField(max_length=40, blank=True)
    new_status = models.CharField(max_length=40, blank=True)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "verification_action_logs"
        ordering = ["created_at", "id"]
        indexes = [
            models.Index(fields=["variance_flag", "created_at"]),
            models.Index(fields=["actor", "created_at"]),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError("Verification action logs are append-only.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Verification action logs cannot be deleted.")
