from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.certification.models import (
    CertificationLine,
    CertificationPackage,
    CertificationPackageState,
    CertifiedQuantity,
)
from apps.execution.models import ExecutionRecordVersion


class CertifiedQuantitySerializer(serializers.ModelSerializer):
    pile_no = serializers.CharField(source="pile.pile_no", read_only=True)

    class Meta:
        model = CertifiedQuantity
        fields = [
            "id",
            "package",
            "certification_line",
            "pile",
            "pile_no",
            "source_execution_version",
            "certified_depth_m",
            "certified_concrete_m3",
            "certified_reinforcement_kg",
            "frozen_snapshot",
            "certified_by",
            "certified_at",
        ]
        read_only_fields = fields


class CertificationLineSerializer(serializers.ModelSerializer):
    pile_no = serializers.CharField(source="pile.pile_no", read_only=True)
    certified_quantity = serializers.SerializerMethodField()

    class Meta:
        model = CertificationLine
        fields = [
            "id",
            "package",
            "pile",
            "pile_no",
            "source_execution_version",
            "certified_depth_m",
            "certified_concrete_m3",
            "certified_reinforcement_kg",
            "quantity_snapshot",
            "certified_quantity",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "package",
            "pile_no",
            "quantity_snapshot",
            "certified_quantity",
            "created_at",
            "updated_at",
        ]

    @extend_schema_field(CertifiedQuantitySerializer(allow_null=True))
    def get_certified_quantity(self, obj):
        try:
            quantity = obj.certified_quantity
        except CertifiedQuantity.DoesNotExist:
            return None
        return CertifiedQuantitySerializer(quantity).data


class CertificationLineCreateSerializer(serializers.ModelSerializer):
    source_execution_version = serializers.PrimaryKeyRelatedField(
        queryset=ExecutionRecordVersion.objects.select_related("execution_record").all()
    )

    class Meta:
        model = CertificationLine
        fields = [
            "pile",
            "source_execution_version",
            "certified_depth_m",
            "certified_concrete_m3",
            "certified_reinforcement_kg",
        ]


class CertificationPackageSerializer(serializers.ModelSerializer):
    lines = CertificationLineSerializer(many=True, read_only=True)
    certified_quantities = CertifiedQuantitySerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )
    submitted_by_username = serializers.CharField(
        source="submitted_by.username",
        read_only=True,
    )
    approved_by_username = serializers.CharField(
        source="approved_by.username",
        read_only=True,
    )
    certified_by_username = serializers.CharField(
        source="certified_by.username",
        read_only=True,
    )

    class Meta:
        model = CertificationPackage
        fields = [
            "id",
            "project",
            "package_no",
            "description",
            "current_state",
            "quantity_snapshot",
            "created_by",
            "created_by_username",
            "submitted_by",
            "submitted_by_username",
            "submitted_at",
            "approved_by",
            "approved_by_username",
            "approved_at",
            "certified_by",
            "certified_by_username",
            "certified_at",
            "locked_at",
            "lines",
            "certified_quantities",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "current_state",
            "quantity_snapshot",
            "created_by",
            "created_by_username",
            "submitted_by",
            "submitted_by_username",
            "submitted_at",
            "approved_by",
            "approved_by_username",
            "approved_at",
            "certified_by",
            "certified_by_username",
            "certified_at",
            "locked_at",
            "lines",
            "certified_quantities",
            "created_at",
            "updated_at",
        ]

    def validate_package_no(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Package number cannot be blank.")
        return value


class CertificationPackageActionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    current_state = serializers.ChoiceField(choices=CertificationPackageState.choices)
    quantity_snapshot = serializers.DictField()
