from django.contrib import admin

from apps.evidence.models import EvidenceItem, EvidenceLink


@admin.register(EvidenceItem)
class EvidenceItemAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "project",
        "original_filename",
        "evidence_type",
        "verification_status",
        "uploaded_by",
        "uploaded_at",
        "is_deleted",
    ]
    list_filter = ["evidence_type", "verification_status", "is_deleted"]
    search_fields = ["original_filename", "sha256_hash"]


@admin.register(EvidenceLink)
class EvidenceLinkAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "evidence",
        "execution_record_version",
        "linked_by",
        "linked_at",
        "is_primary",
    ]
    list_filter = ["is_primary"]
