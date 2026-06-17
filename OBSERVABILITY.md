# Observability & Traceability — YusBuild (repo-verified)

This document reverse-engineers how the repository provides traceability and diagnostics.

It is based on repository-visible evidence:
- `apps/audit/models.py`
- audit services under `apps/audit/services/`
- audit endpoints under `apps/audit/views.py`
- traces of event recording in domain services (imports/calls)
- existing docs created in this repo set (EVENTS.md, WORKFLOWS.md, SEQUENCE_DIAGRAMS.md)

---

## Observability Philosophy

### Verified Facts
- Traceability is implemented via persistent database records:
  - `AuditEvent` (append-only)
  - `TimelineEvent` (append-only)
  - shared base `AppendOnlyModel` prevents updates and deletes.
- User correlation is supported via `actor` fields.

### Inferred Behavior
- Domain services record both audit and timeline events to support investigation and UI timeline views.

---

## Audit Architecture

### Verified Facts
- `apps/audit/models.py::AppendOnlyModel` enforces immutability:
  - `save()` raises if `self.pk` exists
  - `delete()` always raises
- The append-only base model includes:
  - `actor: FK(User)` nullable
  - `project: FK(Project)` PROTECT
  - `pile: FK(Pile)` PROTECT
  - `event_type: CharField(choices=EventType.choices)`
  - `timestamp`
  - `metadata: JSONField`

### Verified Facts
- `AuditEvent`, `TimelineEvent`, and `DomainEvent` extend `AppendOnlyModel` with different tables.

---

## Timeline Endpoints

### Verified Facts
- Audit timeline listing endpoint is implemented by:
  - `apps/audit/views.py::TimelineEventViewSet`.
- Route prefixes under `config/urls.py`:
  - `GET /api/v1/audit/timeline/`
  - plus actions:
    - `GET /api/v1/audit/timeline/project/{project_id}/`
    - `GET /api/v1/audit/timeline/pile/{pile_id}/`

### Verified Facts
- `TimelineEventViewSet.get_queryset()` uses:
  - `visible_timeline_events_queryset(self.request.user)` from selectors.

---

## Event Recording

### Verified Facts
- There are explicit recording services:
  - `apps/audit/services/audit_service.py::record_audit_event(...)`
  - `apps/audit/services/timeline_service.py::record_timeline_event(...)`
- Both recording functions:
  - create the corresponding append-only row
  - set `actor` using a helper that returns `None` when `actor.is_authenticated` is false
  - store `metadata or {}`

### Verified Facts
- Domain services import and call these recording services.
  - Example evidence from repository:
    - `apps/execution/services/submission_service.py`
    - `apps/execution/services/revision_service.py`
    - `apps/approvals/services/approval_service.py`
    - `apps/certification/services/certification_service.py`
    - `apps/certification/services/package_service.py`
    - `apps/evidence/services/evidence_service.py`
    - `apps/verification/services/verification_service.py`

---

## History Tracking

### Verified Facts
- Pile calculation history exists separately from audit timeline:
  - `apps/piles/models.py::PileCalculationHistory`
- Execution immutability exists via:
  - `apps/execution/models.py::ExecutionRecordVersion` refusing updates.

### Inferred Behavior
- Observability uses both:
  - **calculation/history** for engineering correctness
  - **audit/timeline** for workflow traceability

---

## Entity Traceability (by domain)

### Project
- Project access and scoping is enforced via membership.
- Audit/timeline records always bind a `project` FK.

### Pile
- Audit/timeline records always bind a `pile` FK.
- Pile has immutable calculation history snapshots.

### Execution
- Execution record versions are immutable snapshots (`ExecutionRecordVersion`).
- Events are recorded with `event_type` and may attach to project/pile.

### Verification
- Verification flags exist as records tied to `ExecutionRecordVersion`.
- Verification services record timeline/audit events.

### Evidence
- Evidence items are linked to execution versions.
- Evidence service records timeline/audit events.

### Certification
- Certification package lifecycle actions record timeline/audit events.

---

## State Transition Visibility

### Verified Facts
- Workflow transitions are visible through the timeline:
  - `event_type` values include execution submission/revision, approval decisions, evidence linked/verified, verification runs, certification lifecycle events.

### Verified Facts
- `tests/test_audit_workflow.py` verifies:
  - append-only immutability by trying to modify `.metadata` and expecting `ValidationError`
  - timeline query helpers filter by project and pile.

---

## Append-Only Records

### Verified Facts
- Append-only enforcement is implemented centrally in `AppendOnlyModel`.
- Tests confirm immutability behavior.

---

## Diagnostics

### Verified Facts
- Operational traces are accessible through:
  - timeline list endpoints
  - schema-generated API documentation

### Inferred Behavior
- When investigating issues, engineers should query:
  - timeline events scoped by project/pile
  - pile calculation history when engineering quantities seem inconsistent

---

## Investigation Workflow (repository-visible)

### Verified Facts
- Investigation support exists via endpoints that allow filtering:
  - `GET /api/v1/audit/timeline/project/{project_id}/`
  - `GET /api/v1/audit/timeline/pile/{pile_id}/`

---

## Correlation Between Events

### Verified Facts
- Each append-only audit/timeline record includes:
  - `actor`
  - `project`
  - `pile`
  - `event_type`
  - `timestamp`
  - `metadata`

### Inferred Behavior
- Engineers can correlate events chronologically by `timestamp` and filter by project/pile.

---

## Data Provenance

### Verified Facts
- Provenance for pile calculations:
  - calculation history stores `input_snapshot`, `config_snapshot`, `constants_snapshot`, `result_snapshot`.
- Provenance for execution:
  - `ExecutionRecordVersion` stores `data_snapshot` and `source_record_hash`.

---

## Limitations

### Verified/Inferred Limitations
- The timeline/audit model binds to project and pile, but the repository-visible code does not guarantee that every cross-domain workflow is linked to the same execution_record_version id in metadata.
- Exact event trigger-to-service mapping is spread across domain services; consumers should treat `metadata` as best-effort.

---

## Recommendations

### Non-binding guidance (no new security claims)
- Use append-only timeline endpoints scoped by project/pile as the first step.
- Use pile calculation history when the timeline indicates a BOQ repair/recalculation.

