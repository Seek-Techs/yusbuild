"""YusBuild AI serializer template

Use this template for request validation and response shaping.

Rules:
- Serializers validate and normalize inputs.
- Serializers must delegate workflow/persistence to services.
"""

from __future__ import annotations

from rest_framework import serializers


class <Entity>CreateUpdateSerializer(serializers.Serializer):
    """Define fields, validation, and representation for the endpoint."""

    # input fields
    # <field> = serializers.<TypeField>(...)

    def validate(self, attrs):
        # Normalize/validate cross-field constraints.
        # Keep this logic as validation; do not implement workflow transitions.
        return attrs

    def create(self, validated_data):
        # Delegate persistence/workflow to the domain service.
        # service_input = <ServiceInput>(...)
        # result = <service_function_name>(service_input)
        # return result
        raise NotImplementedError

    def update(self, instance, validated_data):
        # Delegate persistence/workflow to services.
        raise NotImplementedError

