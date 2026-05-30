from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.execution.models import ExecutionRecordVersion


class ApprovalDecisionType(models.TextChoices):
    APPROVE = "approve", "Approve"
    REJECT = "reject", "Reject"
    RETURN_FOR_CORRECTION = "return_for_correction", "Return for Correction"
    APPROVE_WITH_COMMENTS = "approve_with_comments", "Approve with Comments"


class ApprovalDecision(models.Model):
    execution_record_version = models.ForeignKey(
        ExecutionRecordVersion,
        on_delete=models.PROTECT,
        related_name="approval_decisions",
    )
    decision = models.CharField(max_length=40, choices=ApprovalDecisionType.choices)
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_decisions",
    )
    decided_at = models.DateTimeField(default=timezone.now, db_index=True)
    comments = models.TextField(blank=True)
    previous_state = models.CharField(max_length=40)
    new_state = models.CharField(max_length=40)

    class Meta:
        db_table = "approval_decisions"
        ordering = ["-decided_at", "-id"]
        indexes = [
            models.Index(fields=["execution_record_version", "decision"]),
            models.Index(fields=["decided_by", "decided_at"]),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError("Approval decisions are append-only.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Approval decisions cannot be deleted.")

    def __str__(self) -> str:
        return f"{self.decision} for version {self.execution_record_version_id}"


class ConsultantComment(models.Model):
    execution_record_version = models.ForeignKey(
        ExecutionRecordVersion,
        on_delete=models.PROTECT,
        related_name="consultant_comments",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="consultant_comments",
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "consultant_comments"
        ordering = ["created_at", "id"]
        indexes = [
            models.Index(fields=["execution_record_version", "created_at"]),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError("Consultant comments are append-only.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Consultant comments cannot be deleted.")

    def __str__(self) -> str:
        return f"Comment for version {self.execution_record_version_id}"


class ApprovalActionLog(models.Model):
    execution_record_version = models.ForeignKey(
        ExecutionRecordVersion,
        on_delete=models.PROTECT,
        related_name="approval_action_logs",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approval_action_logs",
    )
    action = models.CharField(max_length=80, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "approval_action_logs"
        ordering = ["created_at", "id"]
        indexes = [
            models.Index(fields=["execution_record_version", "action"]),
            models.Index(fields=["actor", "created_at"]),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError("Approval action logs are append-only.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Approval action logs cannot be deleted.")

    def __str__(self) -> str:
        return f"{self.action} for version {self.execution_record_version_id}"

