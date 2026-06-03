from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.piles.models import Pile
from apps.projects.models import Project


class EventType(models.TextChoices):
    EXECUTION_SUBMISSION = "EXECUTION_SUBMISSION", "Execution submission"
    EXECUTION_REVISION = "EXECUTION_REVISION", "Execution revision"
    APPROVAL_DECISION = "APPROVAL_DECISION", "Approval decision"
    EVIDENCE_LINKED = "EVIDENCE_LINKED", "Evidence linked"
    EVIDENCE_VERIFIED = "EVIDENCE_VERIFIED", "Evidence verified"
    VERIFICATION_RUN = "VERIFICATION_RUN", "Verification run"
    CERTIFICATION_SUBMITTED = "CERTIFICATION_SUBMITTED", "Certification submitted"
    CERTIFICATION_APPROVED = "CERTIFICATION_APPROVED", "Certification approved"
    CERTIFICATION_CERTIFIED = "CERTIFICATION_CERTIFIED", "Certification certified"
    CERTIFICATION_LOCKED = "CERTIFICATION_LOCKED", "Certification locked"


class AppendOnlyModel(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)ss",
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        related_name="%(class)ss",
    )
    pile = models.ForeignKey(
        Pile,
        on_delete=models.PROTECT,
        related_name="%(class)ss",
    )
    event_type = models.CharField(
        max_length=80, 
        choices=EventType.choices, 
        db_index=True)
    timestamp = models.DateTimeField(
        default=timezone.now, 
        db_index=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        abstract = True
        ordering = ["-timestamp", "-id"]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError("Append-only events cannot be modified.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Append-only events cannot be deleted.")

    def __str__(self) -> str:
        return f"{self.event_type} @ {self.timestamp.isoformat()}"


class AuditEvent(AppendOnlyModel):
    class Meta:
        db_table = "audit_events"


class TimelineEvent(AppendOnlyModel):
    class Meta:
        db_table = "timeline_events"


class DomainEvent(AppendOnlyModel):
    class Meta:
        db_table = "domain_events"
