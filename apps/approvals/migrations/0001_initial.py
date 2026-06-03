# Generated manually for Phase 5A approvals.

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("execution", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ApprovalDecision",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "decision",
                    models.CharField(
                        choices=[
                            ("approve", "Approve"),
                            ("reject", "Reject"),
                            (
                                "return_for_correction",
                                "Return for Correction",
                            ),
                            (
                                "approve_with_comments",
                                "Approve with Comments",
                            ),
                        ],
                        max_length=40,
                    ),
                ),
                (
                    "decided_at",
                    models.DateTimeField(
                        db_index=True,
                        default=django.utils.timezone.now,
                    ),
                ),
                ("comments", models.TextField(blank=True)),
                ("previous_state", models.CharField(max_length=40)),
                ("new_state", models.CharField(max_length=40)),
                (
                    "decided_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="approval_decisions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "execution_record_version",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="approval_decisions",
                        to="execution.executionrecordversion",
                    ),
                ),
            ],
            options={
                "db_table": "approval_decisions",
                "ordering": ["-decided_at", "-id"],
            },
        ),
        migrations.CreateModel(
            name="ConsultantComment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("comment", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "author",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="consultant_comments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "execution_record_version",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="consultant_comments",
                        to="execution.executionrecordversion",
                    ),
                ),
            ],
            options={
                "db_table": "consultant_comments",
                "ordering": ["created_at", "id"],
            },
        ),
        migrations.CreateModel(
            name="ApprovalActionLog",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("action", models.CharField(db_index=True, max_length=80)),
                (
                    "metadata",
                    models.JSONField(blank=True, default=dict),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="approval_action_logs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "execution_record_version",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="approval_action_logs",
                        to="execution.executionrecordversion",
                    ),
                ),
            ],
            options={
                "db_table": "approval_action_logs",
                "ordering": ["created_at", "id"],
            },
        ),
        migrations.AddIndex(
            model_name="approvaldecision",
            index=models.Index(
                fields=["execution_record_version", "decision"],
                name="approval_de_executi_bfa458_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="approvaldecision",
            index=models.Index(
                fields=["decided_by", "decided_at"],
                name="approval_de_decided_ba4f4b_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="consultantcomment",
            index=models.Index(
                fields=["execution_record_version", "created_at"],
                name="consultant__executi_8e13a6_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="approvalactionlog",
            index=models.Index(
                fields=["execution_record_version", "action"],
                name="approval_ac_executi_358504_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="approvalactionlog",
            index=models.Index(
                fields=["actor", "created_at"],
                name="approval_ac_actor_i_6c55dd_idx",
            ),
        ),
    ]
