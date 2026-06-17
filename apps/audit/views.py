from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.models import TimelineEvent
from apps.audit.serializers import TimelineEventSerializer
from apps.audit.services.timeline_service import (
    get_pile_timeline,
    get_project_timeline,
)
from apps.audit.selectors import visible_timeline_events_queryset


class TimelineEventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TimelineEventSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["project", "pile", "event_type"]
    ordering_fields = ["timestamp", "id"]
    ordering = ["-timestamp", "-id"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return TimelineEvent.objects.none()
        return visible_timeline_events_queryset(self.request.user)

    @action(
        detail=False,
        methods=["get"],
        url_path="project/(?P<project_id>[^/.]+)",
    )
    @extend_schema(
        summary="List timeline events for a project",
        responses={200: TimelineEventSerializer(many=True)},
    )
    def project_timeline(self, request, project_id=None):
        events = get_project_timeline(project_id)
        page = self.paginate_queryset(events)
        if page is not None:
            return self.get_paginated_response(
                TimelineEventSerializer(page, many=True).data
            )
        return Response(TimelineEventSerializer(events, many=True).data)

    @action(
        detail=False,
        methods=["get"],
        url_path="pile/(?P<pile_id>[^/.]+)",
    )
    @extend_schema(
        summary="List timeline events for a pile",
        responses={200: TimelineEventSerializer(many=True)},
    )
    def pile_timeline(self, request, pile_id=None):
        events = get_pile_timeline(pile_id)
        page = self.paginate_queryset(events)
        if page is not None:
            return self.get_paginated_response(
                TimelineEventSerializer(page, many=True).data
            )
        return Response(TimelineEventSerializer(events, many=True).data)
