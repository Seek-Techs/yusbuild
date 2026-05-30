from django.contrib import admin

from apps.approvals.models import (
    ApprovalActionLog,
    ApprovalDecision,
    ConsultantComment,
)


@admin.register(ApprovalDecision)
class ApprovalDecisionAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "execution_record_version",
        "decision",
        "decided_by",
        "previous_state",
        "new_state",
        "decided_at",
    ]
    list_filter = ["decision", "previous_state", "new_state"]
    search_fields = ["comments"]


@admin.register(ConsultantComment)
class ConsultantCommentAdmin(admin.ModelAdmin):
    list_display = ["id", "execution_record_version", "author", "created_at"]
    search_fields = ["comment"]


@admin.register(ApprovalActionLog)
class ApprovalActionLogAdmin(admin.ModelAdmin):
    list_display = ["id", "execution_record_version", "actor", "action", "created_at"]
    list_filter = ["action"]

