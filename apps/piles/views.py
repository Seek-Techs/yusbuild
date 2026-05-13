"""
DRF Views for the Piles app.
"""

import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.piles.models import Pile, PileTypeConfiguration, PileCalculation
from apps.piles.serializers import (
    PileDetailSerializer,
    PileCreateUpdateSerializer,
    PileSummarySerializer,
    PileTypeConfigurationSerializer,
)
from apps.piles.calculations import PileCalculator

logger = logging.getLogger(__name__)


class PileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Pile CRUD + calculation operations.

    list: GET /api/v1/piles/
    create: POST /api/v1/piles/ (auto-calculates reinforcement)
    retrieve: GET /api/v1/piles/{id}/
    update: PUT /api/v1/piles/{id}/
    partial_update: PATCH /api/v1/piles/{id}/
    destroy: DELETE /api/v1/piles/{id}/

    Extra actions:
    POST /api/v1/piles/{id}/recalculate/ - Force recalculation
    GET /api/v1/piles/{id}/breakdown/ - Get detailed calculation breakdown
    """

    queryset = Pile.objects.select_related("project", "calculation").all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["pile_type", "project", "diameter_mm"]
    search_fields = ["pile_no", "location_on_site", "notes"]
    ordering_fields = ["pile_no", "created_at", "design_length_m", "actual_length_m"]
    ordering = ["pile_no"]

    def get_queryset(self):
        """Return piles visible to the authenticated user."""
        queryset = super().get_queryset()
        user = self.request.user
        user_groups = set(user.groups.values_list("name", flat=True))
        if user.is_superuser or "admin" in user_groups:
            return queryset
        return queryset.filter(project__memberships__user=user).distinct()

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return PileCreateUpdateSerializer
        if self.action in ["list"]:
            return PileSummarySerializer
        return PileDetailSerializer

    def perform_create(self, serializer):
        """Log pile creation."""
        pile = serializer.save()
        return pile

    def perform_update(self, serializer):
        """Log pile updates."""
        pile = serializer.save()
        return pile

    def perform_destroy(self, instance):
        """Log pile deletion."""
        logger.info(
            "Pile deleted: %s (project=%s)",
            instance.pile_no,
            instance.project.name,
        )
        instance.delete()

    @action(detail=True, methods=["post"], url_path="recalculate")
    def recalculate(self, request, pk=None):
        """
        Force recalculation of pile quantities.

        POST /api/v1/piles/{id}/recalculate/

        Useful when pile type configuration has been updated
        and you need to refresh calculations.
        """
        try:
            pile = self.get_object()
            result = PileCalculator.calculate(pile)

            # Update calculation record
            calculation, _ = PileCalculation.objects.update_or_create(
            pile=pile,
            defaults={
                "main_bars_kg": result.main_bars_kg,
                "helix_kg": result.helix_kg,
                "stiffeners_kg": result.stiffeners_kg,
                "total_steel_kg": result.total_steel_kg,
                "design_concrete_m3": result.design_concrete_m3,
                "actual_concrete_m3": result.actual_concrete_m3,
                "calculation_version": "1.0.0",
            },
        )

            pile.calculation = calculation

            logger.info(
                "Force recalculation completed for pile %s: steel=%.2f kg, concrete=%.4f m3",
                pile.pile_no,
                calculation.total_steel_kg,
                calculation.actual_concrete_m3,
        )

            return Response(
                {
                    "message": "Recalculation completed successfully",
                    "pile_no": pile.pile_no,
                    "result": result.to_dict(),
                }
            )

        except ValueError as exc:
            logger.error("Recalculation failed for pile %s: %s", pk, str(exc))
            return Response(
                {"error": "Recalculation failed", "detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.critical(
                "Unexpected error during recalculation: %s", str(exc), exc_info=True
            )
            return Response(
                {"error": "Internal error", "detail": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["get"], url_path="breakdown")
    def breakdown(self, request, pk=None):
        """
        Get detailed calculation breakdown for a pile.

        GET /api/v1/piles/{id}/breakdown/

        Returns full engineering breakdown including:
        - Main bar sections with lengths and weights
        - Helix turns and total length
        - Stiffener rings and spacing
        - Concrete volumes
        """
        try:
            pile = self.get_object()
            result = PileCalculator.calculate(pile)

            return Response(result.to_dict())

        except ValueError as exc:
            logger.error("Breakdown failed for pile %s: %s", pk, str(exc))
            return Response(
                {"error": "Breakdown failed", "detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            logger.critical(
                "Unexpected error during breakdown: %s", str(exc), exc_info=True
            )
            return Response(
                {"error": "Internal error", "detail": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PileTypeConfigurationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for PileTypeConfiguration (read-only).

    list: GET /api/v1/piles/configs/
    retrieve: GET /api/v1/piles/configs/{id}/
    """

    queryset = PileTypeConfiguration.objects.filter(is_active=True)
    serializer_class = PileTypeConfigurationSerializer
    lookup_field = "pile_type"

    def get_queryset(self):
        """Allow filtering by pile_type."""
        queryset = super().get_queryset()
        pile_type = self.request.query_params.get("pile_type")
        if pile_type:
            queryset = queryset.filter(pile_type=pile_type)
        return queryset
