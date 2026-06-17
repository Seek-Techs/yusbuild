from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from apps.execution.models import PileDrivingRecord
from apps.execution.selectors import visible_pile_driving_records_queryset

from apps.execution.serializers import PileDrivingRecordSerializer
from apps.execution.services.revision_service import create_revision_from_record
from apps.execution.services.state_machine import InvalidExecutionTransition
from apps.execution.services.submission_service import (
    create_draft_driving_record,
    submit_execution_record,
    update_draft_driving_record,
)


@extend_schema_view(
    list=extend_schema(
        summary="List pile driving execution records",
        description="Returns execution records visible to the authenticated user.",
    ),
    retrieve=extend_schema(
        summary="Retrieve a pile driving execution record",
    ),
    create=extend_schema(
        summary="Create a draft pile driving execution record",
        responses={201: PileDrivingRecordSerializer},
    ),
    update=extend_schema(
        summary="Update a mutable draft or returned pile driving record",
        responses={
            200: PileDrivingRecordSerializer,
            409: OpenApiResponse(description="Submitted records are immutable."),
        },
    ),
    partial_update=extend_schema(
        summary="Partially update a mutable draft or returned pile driving record",
        responses={
            200: PileDrivingRecordSerializer,
            409: OpenApiResponse(description="Submitted records are immutable."),
        },
    ),
)
class PileDrivingRecordViewSet(viewsets.ModelViewSet):
    serializer_class = PileDrivingRecordSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["project", "pile", "execution_record__current_state"]
    search_fields = ["pile__pile_no", "hammer_type", "remarks", "contractor_comments"]
    ordering_fields = ["start_time", "created_at", "reported_depth_m", "total_blows"]
    ordering = ["-start_time", "-id"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return PileDrivingRecord.objects.none()
        queryset = visible_pile_driving_records_queryset(self.request.user)
        return (
            queryset.select_related(
                "execution_record__latest_version",
                "execution_record__latest_version__submitted_by",
            )
            .prefetch_related("resistance_logs")
            .all()
        )

    def perform_create(self, serializer):
        self.instance = create_draft_driving_record(
            serializer.validated_data,
            self.request.user,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        output = self.get_serializer(self.instance)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        try:
            updated = update_draft_driving_record(instance, serializer.validated_data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        output = self.get_serializer(updated)
        return Response(output.data)

    @action(detail=True, methods=["post"], url_path="submit")
    @extend_schema(
        summary="Submit an execution record",
        description=(
            "Creates an immutable ExecutionRecordVersion snapshot and moves the "
            "record from DRAFT or RETURNED_FOR_CORRECTION to SUBMITTED."
        ),
        request=None,
        responses={
            200: PileDrivingRecordSerializer,
            409: OpenApiResponse(description="Invalid workflow transition."),
        },
    )
    def submit(self, request, pk=None):
        driving_record = self.get_object()
        try:
            submit_execution_record(driving_record.execution_record, request.user)
        except InvalidExecutionTransition as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        driving_record.refresh_from_db()
        serializer = self.get_serializer(driving_record)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="revise")
    @extend_schema(
        summary="Revise a returned execution record",
        description=(
            "Applies contractor corrections to a returned mutable record and "
            "submits a new immutable version."
        ),
        request=PileDrivingRecordSerializer,
        responses={
            200: PileDrivingRecordSerializer,
            409: OpenApiResponse(description="Invalid transition or immutable record."),
        },
    )
    def revise(self, request, pk=None):
        driving_record = self.get_object()
        serializer = self.get_serializer(
            driving_record,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        try:
            create_revision_from_record(
                driving_record.execution_record,
                request.user,
                revision_data=serializer.validated_data,
            )
        except (InvalidExecutionTransition, ValueError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        driving_record.refresh_from_db()
        output = self.get_serializer(driving_record)
        return Response(output.data, status=status.HTTP_200_OK)
