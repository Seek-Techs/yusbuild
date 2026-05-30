from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.execution.models import ExecutionRecordState, ExecutionRecordVersion
from apps.projects.models import Project


class EvidenceType(models.TextChoices):
    PHOTO = "photo", "Photo"
    VIDEO = "video", "Video"
    DOCUMENT = "document", "Document"
    FIELD_NOTE = "field_note", "Field Note"
    OTHER = "other", "Other"


class EvidenceVerificationStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    VERIFIED = "verified", "Verified"
    REJECTED = "rejected", "Rejected"


class EvidenceItem(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="evidence_items",
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_evidence_items",
    )
    file = models.FileField(upload_to="evidence/%Y/%m/%d/")
    original_filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=120)
    file_size = models.PositiveBigIntegerField()
    sha256_hash = models.CharField(max_length=64, db_index=True)
    uploaded_at = models.DateTimeField(auto_now_add=True, db_index=True)
    captured_at = models.DateTimeField(null=True, blank=True, db_index=True)
    gps_lat = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    gps_lng = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    device_metadata = models.JSONField(default=dict, blank=True)
    evidence_type = models.CharField(
        max_length=40,
        choices=EvidenceType.choices,
        default=EvidenceType.OTHER,
        db_index=True,
    )
    verification_status = models.CharField(
        max_length=40,
        choices=EvidenceVerificationStatus.choices,
        default=EvidenceVerificationStatus.PENDING,
        db_index=True,
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_evidence_items",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False, db_index=True)

    class Meta:
        db_table = "evidence_items"
        ordering = ["-uploaded_at", "-id"]
        indexes = [
            models.Index(fields=["project", "evidence_type"]),
            models.Index(fields=["project", "verification_status"]),
            models.Index(fields=["uploaded_by", "uploaded_at"]),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            existing = EvidenceItem.objects.get(pk=self.pk)
            immutable_fields = [
                "project_id",
                "uploaded_by_id",
                "file",
                "original_filename",
                "content_type",
                "file_size",
                "sha256_hash",
                "captured_at",
                "gps_lat",
                "gps_lng",
                "device_metadata",
                "evidence_type",
            ]
            for field in immutable_fields:
                if getattr(existing, field) != getattr(self, field):
                    raise ValidationError(
                        f"Evidence field '{field}' cannot be changed."
                    )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.links.filter(
            execution_record_version__execution_record__current_state=(
                ExecutionRecordState.APPROVED
            )
        ).exists():
            raise ValidationError(
                "Evidence linked to approved versions cannot be removed."
            )
        self.is_deleted = True
        self.save(update_fields=["is_deleted"])

    def __str__(self) -> str:
        return f"{self.original_filename} ({self.verification_status})"


class EvidenceLink(models.Model):
    evidence = models.ForeignKey(
        EvidenceItem,
        on_delete=models.PROTECT,
        related_name="links",
    )
    execution_record_version = models.ForeignKey(
        ExecutionRecordVersion,
        on_delete=models.PROTECT,
        related_name="evidence_links",
    )
    linked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="evidence_links",
    )
    linked_at = models.DateTimeField(default=timezone.now, db_index=True)
    is_primary = models.BooleanField(default=False)

    class Meta:
        db_table = "evidence_links"
        ordering = ["-is_primary", "linked_at", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["evidence", "execution_record_version"],
                name="unique_evidence_version_link",
            )
        ]
        indexes = [
            models.Index(fields=["execution_record_version", "is_primary"]),
            models.Index(fields=["evidence", "linked_at"]),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            existing = EvidenceLink.objects.get(pk=self.pk)
            immutable_fields = [
                "evidence_id",
                "execution_record_version_id",
                "linked_by_id",
                "linked_at",
            ]
            for field in immutable_fields:
                if getattr(existing, field) != getattr(self, field):
                    raise ValidationError(
                        f"Evidence link field '{field}' cannot be changed."
                    )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        version = ExecutionRecordVersion.objects.select_related("execution_record").get(
            pk=self.execution_record_version_id
        )
        if version.execution_record.current_state == ExecutionRecordState.APPROVED:
            raise ValidationError(
                "Evidence linked to approved versions cannot be removed."
            )
        super().delete(*args, **kwargs)

    def __str__(self) -> str:
        return (
            f"Evidence {self.evidence_id} -> version {self.execution_record_version_id}"
        )
