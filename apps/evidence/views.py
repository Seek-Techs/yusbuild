from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.evidence.models import EvidenceItem
from apps.evidence.serializers import (
    EvidenceItemSerializer,
    EvidenceLinkRequestSerializer,
    EvidenceLinkSerializer,
    EvidenceUploadResponseSerializer,
    EvidenceUploadSerializer,
    EvidenceVerifySerializer,
)
from apps.evidence.services.evidence_service import (
    link_evidence_to_version,
    upload_evidence,
    verify_evidence,
)


@extend_schema_view(
    list=extend_schema(
        summary="List evidence items",
        description=(
            "Returns non-deleted evidence metadata. Supports project, pile, "
            "evidence type, verification status, and uploader filtering."
        ),
    ),
    retrieve=extend_schema(summary="Retrieve evidence item metadata"),
)
class EvidenceItemViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EvidenceItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = [
        "project",
        "evidence_type",
        "verification_status",
        "uploaded_by",
    ]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return EvidenceItem.objects.none()
        queryset = EvidenceItem.objects.select_related(
            "project",
            "uploaded_by",
            "verified_by",
        ).filter(is_deleted=False)
        pile_id = self.request.query_params.get("pile")
        if pile_id:
            queryset = queryset.filter(
                links__execution_record_version__execution_record__pile_id=pile_id,
            )
        return queryset.distinct()

    @action(
        detail=False,
        methods=["post"],
        url_path="upload",
        parser_classes=[MultiPartParser, FormParser],
    )
    @extend_schema(
        summary="Upload evidence",
        description=(
            "Stores evidence with preserved file metadata and SHA-256 hash. "
            "Duplicate hashes are reported as deterministic warnings."
        ),
        request=EvidenceUploadSerializer,
        responses={201: EvidenceUploadResponseSerializer},
    )
    def upload(self, request):
        serializer = EvidenceUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        evidence, warnings = upload_evidence(serializer.validated_data, request.user)
        response = {
            "evidence": EvidenceItemSerializer(
                evidence, context={"request": request}
            ).data,
            "warnings": warnings,
        }
        return Response(response, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="verify")
    @extend_schema(
        summary="Verify evidence",
        description="Updates the verification status for an evidence item.",
        request=EvidenceVerifySerializer,
        responses={200: EvidenceItemSerializer},
    )
    def verify(self, request, pk=None):
        evidence = self.get_object()
        serializer = EvidenceVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        evidence = verify_evidence(
            evidence,
            request.user,
            verification_status=serializer.validated_data["verification_status"],
        )
        return Response(
            EvidenceItemSerializer(evidence).data, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["post"], url_path="link")
    @extend_schema(
        summary="Link evidence to execution version",
        description=(
            "Creates an immutable link from evidence to an "
            "ExecutionRecordVersion snapshot."
        ),
        request=EvidenceLinkRequestSerializer,
        responses={
            201: EvidenceLinkSerializer,
            409: OpenApiResponse(description="Invalid evidence link request."),
        },
    )
    def link(self, request, pk=None):
        evidence = self.get_object()
        serializer = EvidenceLinkRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            evidence_link = link_evidence_to_version(
                evidence,
                serializer.validated_data["execution_record_version"],
                request.user,
                is_primary=serializer.validated_data["is_primary"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return Response(
            EvidenceLinkSerializer(evidence_link).data,
            status=status.HTTP_201_CREATED,
        )
