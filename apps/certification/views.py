from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from apps.certification.models import CertificationPackage
from apps.certification.selectors import visible_certification_packages_queryset

from apps.certification.serializers import (
    CertificationLineCreateSerializer,
    CertificationLineSerializer,
    CertificationPackageSerializer,
)
from apps.certification.services.certification_service import (
    add_certification_line,
    certify_package,
    create_certification_package,
    update_draft_package,
)
from apps.certification.services.package_service import (
    InvalidCertificationTransition,
    approve_package,
    lock_package,
    submit_package,
)


class CertificationPackageViewSet(viewsets.ModelViewSet):
    serializer_class = CertificationPackageSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["project", "current_state"]
    search_fields = ["package_no", "description"]
    ordering_fields = ["created_at", "package_no", "submitted_at", "certified_at"]
    ordering = ["-created_at", "-id"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return CertificationPackage.objects.none()

        queryset = visible_certification_packages_queryset(self.request.user)
        return queryset.all()

    def _conflict(self, exc):
        return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)

    def perform_create(self, serializer):
        self.instance = create_certification_package(
            serializer.validated_data,
            self.request.user,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except IntegrityError as exc:
            return self._conflict(exc)
        output = self.get_serializer(self.instance)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        package = self.get_object()
        serializer = self.get_serializer(package, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        try:
            updated = update_draft_package(package, serializer.validated_data)
        except (ValueError, ValidationError) as exc:
            return self._conflict(exc)
        return Response(self.get_serializer(updated).data)

    @action(detail=True, methods=["post"], url_path="add-line")
    @extend_schema(
        request=CertificationLineCreateSerializer,
        responses={
            201: CertificationLineSerializer,
            409: OpenApiResponse(description="Certification line conflict."),
        },
    )
    def add_line(self, request, pk=None):
        package = self.get_object()
        serializer = CertificationLineCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            line = add_certification_line(package, serializer.validated_data)
        except (IntegrityError, ValueError, ValidationError) as exc:
            return self._conflict(exc)
        return Response(
            CertificationLineSerializer(line).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="submit")
    @extend_schema(
        request=None,
        responses={
            200: CertificationPackageSerializer,
            409: OpenApiResponse(description="Invalid certification transition."),
        },
    )
    def submit(self, request, pk=None):
        try:
            package = submit_package(self.get_object(), request.user)
        except (InvalidCertificationTransition, ValueError) as exc:
            return self._conflict(exc)
        return Response(self.get_serializer(package).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="approve")
    @extend_schema(
        request=None,
        responses={
            200: CertificationPackageSerializer,
            409: OpenApiResponse(description="Invalid certification transition."),
        },
    )
    def approve(self, request, pk=None):
        try:
            package = approve_package(self.get_object(), request.user)
        except InvalidCertificationTransition as exc:
            return self._conflict(exc)
        return Response(self.get_serializer(package).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="certify")
    @extend_schema(
        request=None,
        responses={
            200: CertificationPackageSerializer,
            409: OpenApiResponse(description="Invalid certification transition."),
        },
    )
    def certify(self, request, pk=None):
        try:
            package = certify_package(self.get_object(), request.user)
        except (InvalidCertificationTransition, IntegrityError, ValueError) as exc:
            return self._conflict(exc)
        return Response(self.get_serializer(package).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="lock")
    @extend_schema(
        request=None,
        responses={
            200: CertificationPackageSerializer,
            409: OpenApiResponse(description="Invalid certification transition."),
        },
    )
    def lock(self, request, pk=None):
        try:
            package = lock_package(self.get_object())
        except InvalidCertificationTransition as exc:
            return self._conflict(exc)
        return Response(self.get_serializer(package).data, status=status.HTTP_200_OK)
