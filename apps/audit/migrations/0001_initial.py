import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("projects", "0002_projectmembership_and_more"),
        ("piles", "0005_alter_pile_pile_type"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AuditEvent",
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
                    "actor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="auditevents",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="auditevents",
                        to="projects.project",
                    ),
                ),
                (
                    "pile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="auditevents",
                        to="piles.pile",
                    ),
                ),
                (
                    "event_type",
                    models.CharField(
                        choices=[
                            ("EXECUTION_SUBMISSION", "Execution submission"),
                            ("EXECUTION_REVISION", "Execution revision"),
                            ("APPROVAL_DECISION", "Approval decision"),
                            ("EVIDENCE_LINKED", "Evidence linked"),
                            ("EVIDENCE_VERIFIED", "Evidence verified"),
                            ("VERIFICATION_RUN", "Verification run"),
                            ("CERTIFICATION_SUBMITTED", "Certification submitted"),
                            ("CERTIFICATION_APPROVED", "Certification approved"),
                            ("CERTIFICATION_CERTIFIED", "Certification certified"),
                            ("CERTIFICATION_LOCKED", "Certification locked"),
                        ],
                        db_index=True,
                        max_length=80,
                    ),
                ),
                (
                    "timestamp",
                    models.DateTimeField(
                        default=django.utils.timezone.now, db_index=True
                    ),
                ),
                ("metadata", models.JSONField(default=dict, blank=True)),
            ],
            options={"db_table": "audit_events", "ordering": ["-timestamp", "-id"]},
        ),
        migrations.CreateModel(
            name="TimelineEvent",
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
                    "actor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="timelineevents",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="timelineevents",
                        to="projects.project",
                    ),
                ),
                (
                    "pile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="timelineevents",
                        to="piles.pile",
                    ),
                ),
                (
                    "event_type",
                    models.CharField(
                        choices=[
                            ("EXECUTION_SUBMISSION", "Execution submission"),
                            ("EXECUTION_REVISION", "Execution revision"),
                            ("APPROVAL_DECISION", "Approval decision"),
                            ("EVIDENCE_LINKED", "Evidence linked"),
                            ("EVIDENCE_VERIFIED", "Evidence verified"),
                            ("VERIFICATION_RUN", "Verification run"),
                            ("CERTIFICATION_SUBMITTED", "Certification submitted"),
                            ("CERTIFICATION_APPROVED", "Certification approved"),
                            ("CERTIFICATION_CERTIFIED", "Certification certified"),
                            ("CERTIFICATION_LOCKED", "Certification locked"),
                        ],
                        db_index=True,
                        max_length=80,
                    ),
                ),
                (
                    "timestamp",
                    models.DateTimeField(
                        default=django.utils.timezone.now, db_index=True
                    ),
                ),
                ("metadata", models.JSONField(default=dict, blank=True)),
            ],
            options={"db_table": "timeline_events", "ordering": ["-timestamp", "-id"]},
        ),
        migrations.CreateModel(
            name="DomainEvent",
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
                    "actor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="domainevents",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="domainevents",
                        to="projects.project",
                    ),
                ),
                (
                    "pile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="domainevents",
                        to="piles.pile",
                    ),
                ),
                (
                    "event_type",
                    models.CharField(
                        choices=[
                            ("EXECUTION_SUBMISSION", "Execution submission"),
                            ("EXECUTION_REVISION", "Execution revision"),
                            ("APPROVAL_DECISION", "Approval decision"),
                            ("EVIDENCE_LINKED", "Evidence linked"),
                            ("EVIDENCE_VERIFIED", "Evidence verified"),
                            ("VERIFICATION_RUN", "Verification run"),
                            ("CERTIFICATION_SUBMITTED", "Certification submitted"),
                            ("CERTIFICATION_APPROVED", "Certification approved"),
                            ("CERTIFICATION_CERTIFIED", "Certification certified"),
                            ("CERTIFICATION_LOCKED", "Certification locked"),
                        ],
                        db_index=True,
                        max_length=80,
                    ),
                ),
                (
                    "timestamp",
                    models.DateTimeField(
                        default=django.utils.timezone.now, db_index=True
                    ),
                ),
                ("metadata", models.JSONField(default=dict, blank=True)),
            ],
            options={"db_table": "domain_events", "ordering": ["-timestamp", "-id"]},
        ),
    ]
