from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    OpenApiTypes,
    extend_schema,
)
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.execution.models import ExecutionRecordVersion
from apps.verification.models import VarianceFlag
from apps.verification.selectors import visible_variance_flags_queryset

from apps.verification.serializers import (
    RunVerificationChecksResponseSerializer,
    VarianceFlagSerializer,
    VarianceFlagTransitionSerializer,
)
from apps.verification.services.verification_service import (
    InvalidVarianceFlagTransition,
    acknowledge_flag,
    resolve_flag,
    run_verification_checks,
    waive_flag,
)


class RunVerificationChecksAPIView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = RunVerificationChecksResponseSerializer

    @extend_schema(
        summary="Run verification checks",
        description=(
            "Runs deterministic rule-based verification against an immutable "
            "ExecutionRecordVersion snapshot. Re-running is idempotent and does "
            "not recreate duplicate flags."
        ),
        request=None,
        parameters=[
            OpenApiParameter(
                name="execution_record_version_id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                required=True,
                description="Immutable execution record version id.",
            )
        ],
        responses={200: RunVerificationChecksResponseSerializer},
    )
    def post(self, request, execution_record_version_id):
        version = get_object_or_404(
            ExecutionRecordVersion,
            pk=execution_record_version_id,
        )
        flags = run_verification_checks(version)
        return Response(
            {
                "execution_record_version": version.id,
                "flags": VarianceFlagSerializer(flags, many=True).data,
            },
            status=status.HTTP_200_OK,
        )


class VarianceFlagViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = VarianceFlagSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = [
        "project",
        "pile",
        "severity",
        "category",
        "status",
        "triggered_at",
    ]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return VarianceFlag.objects.none()
        return (
            visible_variance_flags_queryset(self.request.user)
            .select_related(
                "pile",
                "execution_record_version",
                "resolved_by",
            )
            .prefetch_related("action_logs")
        )

    def _transition(self, request, service_func):
        flag = self.get_object()
        serializer = VarianceFlagTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            flag = service_func(
                flag,
                request.user,
                comment=serializer.validated_data["comment"],
            )
        except InvalidVarianceFlagTransition as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return Response(VarianceFlagSerializer(flag).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="acknowledge")
    @extend_schema(
        summary="Acknowledge a variance flag",
        request=VarianceFlagTransitionSerializer,
        responses={
            200: VarianceFlagSerializer,
            409: OpenApiResponse(description="Invalid variance flag transition."),
        },
    )
    def acknowledge(self, request, pk=None):
        return self._transition(request, acknowledge_flag)

    @action(detail=True, methods=["post"], url_path="resolve")
    @extend_schema(
        summary="Resolve a variance flag",
        request=VarianceFlagTransitionSerializer,
        responses={
            200: VarianceFlagSerializer,
            409: OpenApiResponse(description="Invalid variance flag transition."),
        },
    )
    def resolve(self, request, pk=None):
        return self._transition(request, resolve_flag)

    @action(detail=True, methods=["post"], url_path="waive")
    @extend_schema(
        summary="Waive a variance flag",
        request=VarianceFlagTransitionSerializer,
        responses={
            200: VarianceFlagSerializer,
            409: OpenApiResponse(description="Invalid variance flag transition."),
        },
    )
    def waive(self, request, pk=None):
        return self._transition(request, waive_flag)
