"""
DRF Views for the Projects app.
"""

import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.projects.models import Project
from apps.projects.serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectCreateUpdateSerializer,
)

logger = logging.getLogger(__name__)


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project CRUD operations.
    
    list: GET /api/v1/projects/
    create: POST /api/v1/projects/
    retrieve: GET /api/v1/projects/{id}/
    update: PUT /api/v1/projects/{id}/
    partial_update: PATCH /api/v1/projects/{id}/
    destroy: DELETE /api/v1/projects/{id}/
    """

    queryset = Project.objects.all()

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ProjectCreateUpdateSerializer
        if self.action == "retrieve":
            return ProjectDetailSerializer
        return ProjectListSerializer

    def perform_create(self, serializer):
        """Log project creation."""
        project = serializer.save()
        logger.info("Project created: %s (id=%s)", project.name, project.id)
        return project

    def perform_update(self, serializer):
        """Log project updates."""
        project = serializer.save()
        logger.info("Project updated: %s (id=%s)", project.name, project.id)
        return project

    @action(detail=True, methods=["get"], url_path="boq")
    def boq(self, request, pk=None):
        """
        Generate Bill of Quantities for a project.
        
        GET /api/v1/projects/{id}/boq/
        
        Returns:
            - Summary by pile type (count, steel kg, concrete m3)
            - Per-pile detail
            - Grand totals
        """
        try:
            project = self.get_object()
            piles = project.piles.select_related("calculation").all()

            if not piles:
                return Response(
                    {
                        "project": project.name,
                        "message": "No piles found for this project",
                        "summary": {},
                        "piles": [],
                        "grand_totals": {
                            "total_piles": 0,
                            "total_steel_kg": 0.0,
                            "total_steel_tons": 0.0,
                            "total_concrete_m3": 0.0,
                        },
                    }
                )

            # Group by pile type
            type_summary = {}
            pile_details = []

            for pile in piles:
                calc = pile.calculation
                ptype = pile.pile_type

                # Aggregate by type
                if ptype not in type_summary:
                    type_summary[ptype] = {
                        "pile_type": ptype,
                        "count": 0,
                        "total_steel_kg": 0.0,
                        "total_steel_tons": 0.0,
                        "total_concrete_m3": 0.0,
                    }

                type_summary[ptype]["count"] += 1
                type_summary[ptype]["total_steel_kg"] += calc.total_steel_kg
                type_summary[ptype]["total_concrete_m3"] += (
                    calc.actual_concrete_m3
                )

                # Pile detail
                pile_details.append(
                    {
                        "pile_no": pile.pile_no,
                        "pile_type": ptype,
                        "diameter_mm": pile.diameter_mm,
                        "design_length_m": pile.design_length_m,
                        "actual_length_m": pile.actual_length_m,
                        "steel_kg": round(calc.total_steel_kg, 2),
                        "steel_tons": round(calc.total_steel_kg / 1000, 2),
                        "concrete_m3": round(calc.actual_concrete_m3, 4),
                        "breakdown": {
                            "main_bars_kg": round(calc.main_bars_kg, 2),
                            "helix_kg": round(calc.helix_kg, 2),
                            "stiffeners_kg": round(calc.stiffeners_kg, 2),
                        },
                    }
                )

            # Calculate tons for summary
            for ts in type_summary.values():
                ts["total_steel_tons"] = round(ts["total_steel_kg"] / 1000, 2)
                ts["total_steel_kg"] = round(ts["total_steel_kg"], 2)
                ts["total_concrete_m3"] = round(ts["total_concrete_m3"], 4)

            # Grand totals
            grand_totals = {
                "total_piles": len(piles),
                "total_steel_kg": round(sum(p.total_steel_kg for p in piles), 2),
                "total_steel_tons": round(
                    sum(p.total_steel_kg for p in piles) / 1000, 2
                ),
                "total_concrete_m3": round(
                    sum(p.actual_concrete_m3 for p in piles), 4
                ),
            }

            # Steel distribution percentages
            total_steel = grand_totals["total_steel_kg"]
            steel_distribution = {
                "main_bars": {
                    "kg": round(sum(p.main_bars_kg for p in piles), 2),
                    "percentage": round(
                        sum(p.main_bars_kg for p in piles) / total_steel * 100, 1
                    ) if total_steel > 0 else 0,
                },
                "helix": {
                    "kg": round(sum(p.helix_kg for p in piles), 2),
                    "percentage": round(
                        sum(p.helix_kg for p in piles) / total_steel * 100, 1
                    ) if total_steel > 0 else 0,
                },
                "stiffeners": {
                    "kg": round(sum(p.stiffeners_kg for p in piles), 2),
                    "percentage": round(
                        sum(p.stiffeners_kg for p in piles) / total_steel * 100, 1
                    ) if total_steel > 0 else 0,
                },
            }

            logger.info(
                "BOQ generated for project %s: %s piles, %.2f kg steel",
                project.name,
                len(piles),
                grand_totals["total_steel_kg"],
            )

            return Response(
                {
                    "project": {
                        "id": project.id,
                        "name": project.name,
                        "location": project.location,
                        "client": project.client,
                        "status": project.status,
                    },
                    "summary_by_type": list(type_summary.values()),
                    "steel_distribution": steel_distribution,
                    "piles": pile_details,
                    "grand_totals": grand_totals,
                }
            )

        except Exception as exc:
            logger.error("BOQ generation failed: %s", str(exc), exc_info=True)
            return Response(
                {"error": "Failed to generate BOQ", "detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
