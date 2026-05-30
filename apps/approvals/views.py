from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.approvals.serializers import (
    ApprovalDecisionRequestSerializer,
    ApprovalDecisionResponseSerializer,
    ConsultantCommentRequestSerializer,
    ConsultantCommentResponseSerializer,
)
from apps.approvals.services.approval_service import (
    approve_record_version,
    reject_record_version,
    return_record_for_correction,
)
from apps.approvals.services.review_service import add_consultant_comment
from apps.execution.services.state_machine import InvalidExecutionTransition


class ApprovalWorkflowViewSet(viewsets.ViewSet):
    serializer_class = ApprovalDecisionRequestSerializer

    def get_serializer_class(self):
        if self.action == "comments":
            return ConsultantCommentRequestSerializer
        return ApprovalDecisionRequestSerializer

    def _validated_request(self, serializer_class, request):
        serializer = serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    @action(detail=False, methods=["post"], url_path="approve")
    @extend_schema(
        summary="Approve an execution record version",
        description=(
            "Targets an immutable ExecutionRecordVersion. Submitted versions "
            "enter UNDER_REVIEW before transitioning to APPROVED."
        ),
        request=ApprovalDecisionRequestSerializer,
        responses={
            200: ApprovalDecisionResponseSerializer,
            409: OpenApiResponse(description="Invalid workflow transition."),
        },
    )
    def approve(self, request):
        data = self._validated_request(ApprovalDecisionRequestSerializer, request)
        try:
            decision = approve_record_version(
                data["execution_record_version"],
                request.user,
                comments=data["comments"],
            )
        except (InvalidExecutionTransition, ValueError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return Response(
            ApprovalDecisionResponseSerializer(decision).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="reject")
    @extend_schema(
        summary="Reject an execution record version",
        description=(
            "Targets an immutable ExecutionRecordVersion and records an "
            "append-only consultant rejection decision."
        ),
        request=ApprovalDecisionRequestSerializer,
        responses={
            200: ApprovalDecisionResponseSerializer,
            409: OpenApiResponse(description="Invalid workflow transition."),
        },
    )
    def reject(self, request):
        data = self._validated_request(ApprovalDecisionRequestSerializer, request)
        try:
            decision = reject_record_version(
                data["execution_record_version"],
                request.user,
                comments=data["comments"],
            )
        except (InvalidExecutionTransition, ValueError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return Response(
            ApprovalDecisionResponseSerializer(decision).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="return-for-correction")
    @extend_schema(
        summary="Return an execution record version for correction",
        description=(
            "Targets an immutable ExecutionRecordVersion and moves the workflow "
            "to RETURNED_FOR_CORRECTION for contractor revision."
        ),
        request=ApprovalDecisionRequestSerializer,
        responses={
            200: ApprovalDecisionResponseSerializer,
            409: OpenApiResponse(description="Invalid workflow transition."),
        },
    )
    def return_for_correction(self, request):
        data = self._validated_request(ApprovalDecisionRequestSerializer, request)
        try:
            decision = return_record_for_correction(
                data["execution_record_version"],
                request.user,
                comments=data["comments"],
            )
        except (InvalidExecutionTransition, ValueError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        return Response(
            ApprovalDecisionResponseSerializer(decision).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="comments")
    @extend_schema(
        summary="Add a consultant comment",
        description=(
            "Adds an append-only consultant comment against an immutable "
            "ExecutionRecordVersion."
        ),
        request=ConsultantCommentRequestSerializer,
        responses={201: ConsultantCommentResponseSerializer},
    )
    def comments(self, request):
        data = self._validated_request(ConsultantCommentRequestSerializer, request)
        comment = add_consultant_comment(
            data["execution_record_version"],
            request.user,
            data["comment"],
        )
        return Response(
            ConsultantCommentResponseSerializer(comment).data,
            status=status.HTTP_201_CREATED,
        )
