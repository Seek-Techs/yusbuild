from rest_framework import serializers

from apps.execution.models import (
    DrivingResistanceLog,
    ExecutionRecordState,
    ExecutionRecordVersion,
    PileDrivingRecord,
)


class DrivingResistanceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DrivingResistanceLog
        fields = [
            "id",
            "sequence_no",
            "depth_from_m",
            "depth_to_m",
            "penetration_mm",
            "blow_count",
            "set_per_blow",
            "notes",
        ]
        read_only_fields = ["id"]


class ExecutionRecordVersionSerializer(serializers.ModelSerializer):
    submitted_by_username = serializers.CharField(
        source="submitted_by.username",
        read_only=True,
    )

    class Meta:
        model = ExecutionRecordVersion
        fields = [
            "id",
            "version_no",
            "submitted_by",
            "submitted_by_username",
            "submitted_at",
            "data_snapshot",
            "source_record_hash",
            "supersedes_version",
        ]
        read_only_fields = fields


class PileDrivingRecordSerializer(serializers.ModelSerializer):
    resistance_logs = DrivingResistanceLogSerializer(many=True, required=False)
    execution_record = serializers.IntegerField(
        source="execution_record_id",
        read_only=True,
    )
    current_state = serializers.CharField(
        source="execution_record.current_state",
        read_only=True,
    )
    current_version_no = serializers.IntegerField(
        source="execution_record.current_version_no",
        read_only=True,
    )
    latest_version = ExecutionRecordVersionSerializer(
        source="execution_record.latest_version",
        read_only=True,
    )

    class Meta:
        model = PileDrivingRecord
        fields = [
            "id",
            "execution_record",
            "project",
            "pile",
            "current_state",
            "current_version_no",
            "latest_version",
            "start_time",
            "end_time",
            "reported_depth_m",
            "verified_depth_m",
            "hammer_type",
            "hammer_energy",
            "final_set",
            "total_blows",
            "remarks",
            "contractor_comments",
            "resistance_logs",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "execution_record",
            "current_state",
            "current_version_no",
            "latest_version",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if self.instance and (
            "project" in self.initial_data or "pile" in self.initial_data
        ):
            raise serializers.ValidationError(
                "Project and pile cannot be changed after draft creation."
            )

        project = attrs.get("project", getattr(self.instance, "project", None))
        pile = attrs.get("pile", getattr(self.instance, "pile", None))
        if project and pile and pile.project_id != project.id:
            raise serializers.ValidationError(
                {"pile": "Pile must belong to the selected project."}
            )

        start_time = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end_time = attrs.get("end_time", getattr(self.instance, "end_time", None))
        if start_time and end_time and end_time < start_time:
            raise serializers.ValidationError(
                {"end_time": "End time must be after start time."}
            )

        logs = attrs.get("resistance_logs")
        if logs is not None:
            sequence_numbers = [log["sequence_no"] for log in logs]
            if len(sequence_numbers) != len(set(sequence_numbers)):
                raise serializers.ValidationError(
                    {"resistance_logs": "Log sequence numbers must be unique."}
                )
            for index, log in enumerate(logs):
                if log["depth_to_m"] < log["depth_from_m"]:
                    raise serializers.ValidationError(
                        {
                            "resistance_logs": (
                                f"Row {index + 1} depth_to_m must be greater than "
                                "or equal to depth_from_m."
                            )
                        }
                    )
        return attrs


class DrivingRecordActionResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    execution_record = serializers.IntegerField()
    current_state = serializers.ChoiceField(choices=ExecutionRecordState.choices)
    current_version_no = serializers.IntegerField()
    latest_version = ExecutionRecordVersionSerializer()
