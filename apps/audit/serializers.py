from rest_framework import serializers

from apps.audit.models import AuditEvent, DomainEvent, TimelineEvent


class AuditEventSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    pile_no = serializers.CharField(source="pile.pile_no", read_only=True)

    class Meta:
        model = AuditEvent
        fields = [
            "id",
            "actor",
            "actor_username",
            "project",
            "project_name",
            "pile",
            "pile_no",
            "event_type",
            "timestamp",
            "metadata",
        ]
        read_only_fields = fields


class TimelineEventSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    pile_no = serializers.CharField(source="pile.pile_no", read_only=True)

    class Meta:
        model = TimelineEvent
        fields = [
            "id",
            "actor",
            "actor_username",
            "project",
            "project_name",
            "pile",
            "pile_no",
            "event_type",
            "timestamp",
            "metadata",
        ]
        read_only_fields = fields


class DomainEventSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    pile_no = serializers.CharField(source="pile.pile_no", read_only=True)

    class Meta:
        model = DomainEvent
        fields = [
            "id",
            "actor",
            "actor_username",
            "project",
            "project_name",
            "pile",
            "pile_no",
            "event_type",
            "timestamp",
            "metadata",
        ]
        read_only_fields = fields
