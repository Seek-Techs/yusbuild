"""
DRF Views for the Piles app.
"""

import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.piles.models import Pile, PileTypeConfiguration, PileCalculationHistory
from apps.piles.serializers import (
    PileDetailSerializer,
    PileCreateUpdateSerializer,
    PileSummarySerializer,
    PileTypeConfigurationSerializer,
    PileCalculationHistorySerializer,
)
from apps.piles.calculations import PileCalculator
from apps.piles.services import calculate_and_persist_pile

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
            calculation, history, result = calculate_and_persist_pile(
                pile,
                triggered_by=request.user,
                trigger=PileCalculationHistory.TRIGGER_RECALCULATE,
                reason=request.data.get("reason", "Manual recalculation"),
            )

            logger.info(
                "Force recalculation completed for pile %s: steel=%.2f kg, concrete=%.4f m3, history_id=%s",
                pile.pile_no,
                calculation.total_steel_kg,
                calculation.actual_concrete_m3,
                history.id,
            )

            return Response(
                {
                    "message": "Recalculation completed successfully",
                    "pile_no": pile.pile_no,
                    "history_id": history.id,
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

    @action(detail=True, methods=["get"], url_path="calculation-history")
    def calculation_history(self, request, pk=None):
        """
        Get immutable calculation history for a pile.

        GET /api/v1/piles/{id}/calculation-history/
        """
        pile = self.get_object()
        history = pile.calculation_history.select_related("triggered_by").all()
        page = self.paginate_queryset(history)
        if page is not None:
            serializer = PileCalculationHistorySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = PileCalculationHistorySerializer(history, many=True)
        return Response(serializer.data)


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
