from rest_framework import serializers

from apps.evidence.models import (
    EvidenceItem,
    EvidenceLink,
    EvidenceType,
    EvidenceVerificationStatus,
)
from apps.execution.models import ExecutionRecordVersion


class EvidenceItemSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(
        source="uploaded_by.username",
        read_only=True,
    )
    verified_by_username = serializers.CharField(
        source="verified_by.username",
        read_only=True,
    )

    class Meta:
        model = EvidenceItem
        fields = [
            "id",
            "project",
            "uploaded_by",
            "uploaded_by_username",
            "file",
            "original_filename",
            "content_type",
            "file_size",
            "sha256_hash",
            "uploaded_at",
            "captured_at",
            "gps_lat",
            "gps_lng",
            "device_metadata",
            "evidence_type",
            "verification_status",
            "verified_by",
            "verified_by_username",
            "verified_at",
            "is_deleted",
        ]
        read_only_fields = fields


class EvidenceUploadSerializer(serializers.Serializer):
    project = serializers.IntegerField()
    file = serializers.FileField()
    captured_at = serializers.DateTimeField(required=False, allow_null=True)
    gps_lat = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=False,
        allow_null=True,
    )
    gps_lng = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=False,
        allow_null=True,
    )
    device_metadata = serializers.JSONField(required=False, default=dict)
    evidence_type = serializers.ChoiceField(
        choices=EvidenceType.choices,
        default=EvidenceType.OTHER,
    )

    def validate_project(self, value):
        from apps.projects.models import Project

        try:
            return Project.objects.get(pk=value)
        except Project.DoesNotExist as exc:
            raise serializers.ValidationError("Project does not exist.") from exc

    def validate(self, attrs):
        attrs = super().validate(attrs)
        gps_lat = attrs.get("gps_lat")
        gps_lng = attrs.get("gps_lng")
        if (gps_lat is None) != (gps_lng is None):
            raise serializers.ValidationError(
                "GPS latitude and longitude must be provided together."
            )
        return attrs


class EvidenceUploadResponseSerializer(serializers.Serializer):
    evidence = EvidenceItemSerializer()
    warnings = serializers.ListField(child=serializers.DictField())


class EvidenceVerifySerializer(serializers.Serializer):
    verification_status = serializers.ChoiceField(
        choices=[
            EvidenceVerificationStatus.VERIFIED,
            EvidenceVerificationStatus.REJECTED,
        ],
    )


class EvidenceLinkRequestSerializer(serializers.Serializer):
    execution_record_version = serializers.PrimaryKeyRelatedField(
        queryset=ExecutionRecordVersion.objects.all(),
    )
    is_primary = serializers.BooleanField(required=False, default=False)


class EvidenceLinkSerializer(serializers.ModelSerializer):
    linked_by_username = serializers.CharField(
        source="linked_by.username",
        read_only=True,
    )

    class Meta:
        model = EvidenceLink
        fields = [
            "id",
            "evidence",
            "execution_record_version",
            "linked_by",
            "linked_by_username",
            "linked_at",
            "is_primary",
        ]
        read_only_fields = fields
