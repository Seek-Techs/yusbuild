from django.contrib import admin

from apps.verification.models import VarianceFlag, VerificationActionLog


@admin.register(VarianceFlag)
class VarianceFlagAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "project",
        "pile",
        "category",
        "severity",
        "status",
        "rule_code",
        "triggered_at",
    ]
    list_filter = ["category", "severity", "status"]
    search_fields = ["rule_code", "message"]


@admin.register(VerificationActionLog)
class VerificationActionLogAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "variance_flag",
        "actor",
        "action",
        "previous_status",
        "new_status",
        "created_at",
    ]
    list_filter = ["action", "previous_status", "new_status"]
