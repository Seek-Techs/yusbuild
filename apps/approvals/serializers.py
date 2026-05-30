from rest_framework import serializers

from apps.approvals.models import ApprovalDecision, ConsultantComment
from apps.execution.models import ExecutionRecordVersion


class ApprovalDecisionRequestSerializer(serializers.Serializer):
    execution_record_version = serializers.PrimaryKeyRelatedField(
        queryset=ExecutionRecordVersion.objects.all(),
    )
    comments = serializers.CharField(required=False, allow_blank=True, default="")


class ConsultantCommentRequestSerializer(serializers.Serializer):
    execution_record_version = serializers.PrimaryKeyRelatedField(
        queryset=ExecutionRecordVersion.objects.all(),
    )
    comment = serializers.CharField(allow_blank=False)


class ApprovalDecisionResponseSerializer(serializers.ModelSerializer):
    decided_by_username = serializers.CharField(
        source="decided_by.username",
        read_only=True,
    )

    class Meta:
        model = ApprovalDecision
        fields = [
            "id",
            "execution_record_version",
            "decision",
            "decided_by",
            "decided_by_username",
            "decided_at",
            "comments",
            "previous_state",
            "new_state",
        ]
        read_only_fields = fields


class ConsultantCommentResponseSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = ConsultantComment
        fields = [
            "id",
            "execution_record_version",
            "author",
            "author_username",
            "comment",
            "created_at",
        ]
        read_only_fields = fields

