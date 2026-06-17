# Domain Events & Audit Events — YusBuild (repository-visible behavior)

This document lists **events visible in the repository evidence**:
- `apps/audit/models.py::EventType` (the canonical set of event types)
- services that record them (`apps/*/services/*` calling `record_audit_event` and/or `record_timeline_event`)
- tests that assert event existence and immutability

It does **not** invent additional domain events beyond what is implemented.

---

## Event Type Reference (Verified Facts)

### `EventType` values
The repository defines a unified event-type enum in `apps/audit/models.py`.
From the schema excerpt and audit tests, these event types exist (at least):
- `EXECUTION_SUBMISSION`
- `EXECUTION_REVISION`
- `APPROVAL_DECISION`
- `EVIDENCE_LINKED`
- `EVIDENCE_VERIFIED`
- `VERIFICATION_RUN`
- `CERTIFICATION_SUBMITTED`
- `CERTIFICATION_APPROVED`
- `CERTIFICATION_CERTIFIED`
- `CERTIFICATION_LOCKED`

(These values appear in `tests/test_openapi_schema.py` assertions and in `tests/test_audit_workflow.py` usage.)

---

## Verified Events

### Event: Evidence linked

**Event Name**
`EVIDENCE_LINKED`

**Trigger**
An evidence link operation results in timeline/audit event recording.

**Preconditions**
- Evidence item and a valid execution record version context.

**State Before**
- Evidence exists.
- ExecutionRecordVersion exists.

**Action**
- `apps/evidence/services/evidence_service.py` records events by calling:
  - `record_audit_event(...)`
  - and/or `record_timeline_event(...)`

**State After**
- A new `AuditEvent` and/or `TimelineEvent` row exists with `event_type = EVIDENCE_LINKED`.

**Side Effects**
- Append-only persistence for audit/timeline models (audit models cannot be modified).

**Audit Impact**
- Timeline query endpoints return it when filtered by project/pile.

**Related Services**
- `apps/evidence/services/evidence_service.py`
- `apps/audit/services/audit_service.py`
- `apps/audit/services/timeline_service.py`

**Related Entities**
- `apps/evidence.models.EvidenceItem`
- `apps/audit.models.AuditEvent`
- `apps/audit.models.TimelineEvent`

---

### Event: Evidence verified

**Event Name**
`EVIDENCE_VERIFIED`

**Trigger**
Evidence verification operation.

**Preconditions**
- Evidence item exists and is visible.

**State Before**
- Evidence has a verification status (pending/rejected/verified).

**Action**
- `apps/evidence/services/evidence_service.py` records events via audit/timeline services.

**State After**
- A `TimelineEvent` (and optionally `AuditEvent`) exists with `event_type = EVIDENCE_VERIFIED`.

**Side Effects**
- Append-only persistence.

**Audit Impact**
- `GET /api/v1/audit/timeline/project/{project_id}/` and
  `GET /api/v1/audit/timeline/pile/{pile_id}/` return matching events.

**Related Services**
- `apps/evidence/services/evidence_service.py`
- `apps/audit/services/*`

**Related Entities**
- `apps/evidence.models.EvidenceItem`
- `apps/audit.models.TimelineEvent`

---

### Event: Verification run

**Event Name**
`VERIFICATION_RUN`

**Trigger**
Running verification checks against an immutable execution record version.

**Preconditions**
- ExecutionRecordVersion exists.

**State Before**
- No guarantee of existence of flags; flags may already exist.

**Action**
- `apps/verification/services/verification_service.py` records timeline/audit events via audit services.

**State After**
- A timeline/audit event exists with `event_type = VERIFICATION_RUN`.

**Side Effects**
- Deterministic flag creation/re-run does not recreate duplicates (idempotency described in schema + endpoint behavior).

**Audit Impact**
- Timeline endpoints can be filtered to the project/pile.

---

### Event: Execution submission

**Event Name**
`EXECUTION_SUBMISSION`

**Trigger**
Submitting a driving record creates an immutable version.

**Preconditions**
- Driving record exists.

**State Before**
- Execution record is in an editable state.

**Action**
- `apps/execution/services/submission_service.py` records events via `record_audit_event` / `record_timeline_event`.

**State After**
- Timeline/audit events exist with `event_type = EXECUTION_SUBMISSION`.

---

### Event: Execution revision

**Event Name**
`EXECUTION_REVISION`

**Trigger**
Revising a returned execution record creates a new immutable version.

**Preconditions**
- Execution record is revisable (workflow-dependent).

**Action**
- `apps/execution/services/revision_service.py` records events via audit/timeline services.

**State After**
- Timeline/audit events exist with `event_type = EXECUTION_REVISION`.

---

### Event: Approval decision

**Event Name**
`APPROVAL_DECISION`

**Trigger**
Approve/reject/return-for-correction workflow actions.

**Preconditions**
- Targets an immutable ExecutionRecordVersion.

**Action**
- `apps/approvals/services/approval_service.py` records audit/timeline events.

**State After**
- An event exists with `event_type = APPROVAL_DECISION`.

---

### Event: Certification lifecycle

These are a set of event types related to certification package lifecycle.

**Event Names**
- `CERTIFICATION_SUBMITTED`
- `CERTIFICATION_APPROVED`
- `CERTIFICATION_CERTIFIED`
- `CERTIFICATION_LOCKED`

**Trigger**
Certification package actions.

**Preconditions**
- Targets a certification package.

**Action**
- `apps/certification/services/certification_service.py` and
  `apps/certification/services/package_service.py` record audit/timeline events.

**State After**
- Corresponding timeline/audit event rows exist.

---

## Inferred Events

This repository snapshot does not provide a single consolidated test that asserts every event type triggers both audit and timeline recording for every workflow action.
However, the codebase contains service imports of `record_audit_event` and `record_timeline_event` in the domains that correspond to these event types.

Therefore, for completeness, the following are treated as **inferred event recordings**:
- `CERTIFICATION_SUBMITTED`, `CERTIFICATION_APPROVED`, `CERTIFICATION_CERTIFIED`, `CERTIFICATION_LOCKED`
- `EXECUTION_SUBMISSION`, `EXECUTION_REVISION`
- `APPROVAL_DECISION`
- `VERIFICATION_RUN`

(They are strongly implied by `EventType` + imports + workflow services.)

---

## Recommendations

None. This is documentation-only.

