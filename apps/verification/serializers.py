from rest_framework import serializers

from apps.verification.models import VarianceFlag, VerificationActionLog


class VerificationActionLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        model = VerificationActionLog
        fields = [
            "id",
            "actor",
            "actor_username",
            "action",
            "previous_status",
            "new_status",
            "comment",
            "created_at",
        ]
        read_only_fields = fields


class VarianceFlagSerializer(serializers.ModelSerializer):
    resolved_by_username = serializers.CharField(
        source="resolved_by.username",
        read_only=True,
    )
    action_logs = VerificationActionLogSerializer(many=True, read_only=True)

    class Meta:
        model = VarianceFlag
        fields = [
            "id",
            "project",
            "pile",
            "execution_record_version",
            "category",
            "severity",
            "status",
            "expected_value",
            "reported_value",
            "verified_value",
            "message",
            "rule_code",
            "triggered_at",
            "resolved_at",
            "resolved_by",
            "resolved_by_username",
            "resolution_comment",
            "action_logs",
        ]
        read_only_fields = fields


class VarianceFlagTransitionSerializer(serializers.Serializer):
    comment = serializers.CharField(required=False, allow_blank=True, default="")


class RunVerificationChecksResponseSerializer(serializers.Serializer):
    execution_record_version = serializers.IntegerField()
    flags = VarianceFlagSerializer(many=True)
