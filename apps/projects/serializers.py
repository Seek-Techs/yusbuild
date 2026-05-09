"""
DRF Serializers for the Projects app.
"""

import logging
from rest_framework import serializers
from apps.projects.models import Project

logger = logging.getLogger(__name__)


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for project list views."""

    total_piles = serializers.IntegerField(read_only=True)
    total_steel_kg = serializers.FloatField(read_only=True)
    total_steel_tons = serializers.SerializerMethodField()
    total_concrete_m3 = serializers.FloatField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "location",
            "client",
            "status",
            "total_piles",
            "total_steel_kg",
            "total_steel_tons",
            "total_concrete_m3",
            "created_at",
            "updated_at",
        ]

    def get_total_steel_tons(self, obj: Project) -> float:
        """Convert kg to metric tons."""
        return round(obj.total_steel_kg / 1000, 2)


class ProjectDetailSerializer(ProjectListSerializer):
    """Full serializer with pile breakdown."""

    piles = serializers.SerializerMethodField()

    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + [
            "description",
            "created_by",
            "piles",
        ]

    def get_piles(self, obj: Project):
        """Return simplified pile data for the project."""
        from apps.piles.serializers import PileSummarySerializer
        piles = obj.piles.select_related("calculation").all()
        return PileSummarySerializer(piles, many=True).data


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating projects."""

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "location",
            "client",
            "description",
            "status",
            "created_by",
        ]
        read_only_fields = ["id"]
