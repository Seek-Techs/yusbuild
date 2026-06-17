# YusBuild Workflows (repo-verified)

This document reverse-engineers **only the workflows visible in the repository code** (views/services/serializers/models/tests/routing/OpenAPI).

Each workflow is split into:

- **Verified Workflow**: directly implemented in code + exercised by tests where applicable.
- **Inferred Workflow**: strongly implied by architecture but not fully spelled out in a single code path.
- **Recommendations**: non-breaking guidance for how engineers should interact with the workflow.

---

## Common actors and concepts (verified)

### Actors
- **Authenticated user** via JWT (default auth: `rest_framework_simplejwt.authentication.JWTAuthentication`).
- **Group roles**: `admin`, `engineer`, `viewer` drive write-vs-read permissions (`apps/common/permissions.py::IsAdminEngineerOrReadOnly`).
- **Project memberships** (`apps/projects/models.py::ProjectMembership`) drive queryset scoping in selectors (`apps/*/selectors.py`).

### Preconditions (verified, common)
- Endpoint access depends on JWT authentication and DRF permission.
- Visible rows are scoped by selectors filtering project membership unless user is superuser/admin.

---

## Project Lifecycle

### Verified Workflow: Create / Update / Delete Project
**Purpose**
Manage `Project` entities and attach creator membership.

**Actors**
- Authenticated user with write permission (`admin`/`engineer` group)

**Preconditions**
- User must have permission (default permission class).

**Trigger**
- `POST /api/v1/projects/` (create)
- `PUT/PATCH /api/v1/projects/{id}/` (update)
- `DELETE /api/v1/projects/{id}/` (delete)

**Main Flow**
1. `ProjectViewSet.perform_create()` saves the project.
2. `perform_create()` creates a `ProjectMembership` for the creator:
   - role `admin` if user is in `admin` group (or superuser)
   - otherwise role `engineer`
3. Update/destroy uses standard DRF `ModelViewSet` behavior.

**Alternative Flows**
- None explicitly visible beyond standard DRF update variants.

**Validation Rules**
- `Project.name` has `MinLengthValidator(2)` (model constraint).
- Project serializer shapes are defined in `apps/projects/serializers.py` (not reproduced here).

**State Transitions**
- `Project.status` is a field with choices:
  - `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED` (`apps/projects/models.py`)

**Error Conditions**
- Authorization failures produce DRF permission responses (and are tested elsewhere).

**Postconditions**
- Project exists; membership row exists for creator on create.

---

## Pile Lifecycle

### Verified Workflow: Create Pile + Auto-calculate
**Purpose**
Create a pile and persist its reinforcement calculation.

**Actors**
- Authenticated engineer/admin for the target project.

**Preconditions**
- Request passes permission checks.
- Target project is visible and writable (enforced via permission + serializer validation + selectors).

**Trigger**
- `POST /api/v1/piles/`

**Main Flow**
1. `PileViewSet.perform_create()` saves pile via `PileCreateUpdateSerializer.create()`.
2. Serializer `.create()` calls `_run_calculation()`:
   - `_run_calculation()` delegates persistence and snapshotting to `apps/piles/services.py::calculate_and_persist_pile()`.
3. `calculate_and_persist_pile()`:
   - calculates using `PileCalculator.calculate(pile)`
   - updates/creates `PileCalculation` (current calculation)
   - creates immutable `PileCalculationHistory` with snapshots:
     - `input_snapshot`, `config_snapshot`, `constants_snapshot`, `result_snapshot`
4. Response includes `calculation_result` (serialized output uses `to_representation` logic).

**Alternative Flows**
- None; all pile creates go through `PileCreateUpdateSerializer`.

**Validation Rules (visible in code)**
- `PileCreateUpdateSerializer.to_internal_value()`:
  - normalizes `pile_type` variants (e.g. `TYPE 1` -> `TYPE_I`)
  - coerces numeric strings for `diameter_mm`, `design_length_m`, `actual_length_m`
- `validate_pile_type()` checks choice membership against `Pile.PILE_TYPE_CHOICES`.
- `validate()` ensures:
  - active `PileTypeConfiguration` exists for config lookup (maps `BORED` -> `TYPE_I`).
  - design/actual lengths must be > 0.
  - warning log if `actual_length_m < design_length_m`.
  - `pile_no` uniqueness within project (case-insensitive).
  - write access for the project is checked via `ProjectMembership` existence.

**State Transitions**
- `PileCalculationHistory.trigger` includes:
  - `"create"` (tested in `tests/test_api.py` for history count + trigger)

**Error Conditions**
- 400 on validation issues.
- Authorization failures (401/403/400 depending on how selector/permission behaves).

**Postconditions**
- `PileCalculation` and at least one `PileCalculationHistory` row exist.

---

### Verified Workflow: Update Pile + Conditional Recalculate
**Purpose**
Update pile fields and recalculate quantities only when quantity inputs change.

**Actors**
- Authenticated engineer/admin.

**Preconditions**
- Same as create; and serializers disallow some mutation patterns.

**Trigger**
- `PUT/PATCH /api/v1/piles/{id}/`

**Main Flow**
1. Serializer `.update()` persists fields and determines whether recalculation is needed.
2. Recalculation triggers when any of:
   - `pile_type`
   - `diameter_mm`
   - `design_length_m`
   - `actual_length_m`
3. When recalculation is needed:
   - serializer calls `_run_calculation()` delegating to `calculate_and_persist_pile()`
   - creates a new `PileCalculationHistory` entry with trigger `"update"`.

**Alternative Flows**
- If update changes non-recalculation fields only (e.g. `notes`):
  - no new calculation history is created by design.

**Validation Rules**
- `PileCreateUpdateSerializer.validate()` enforces:
  - active config existence
  - positive lengths
  - uniqueness of `pile_no` within project
  - membership write access

**State Transitions**
- `PileCalculationHistory.trigger == "update"` when quantity fields change.
- `trigger` values and history behavior are validated in `tests/test_api.py`.

**Error Conditions**
- 400 for invalid inputs (pile type/config/lengths/pile_no duplicates).

**Postconditions**
- `Pile` updated; recalculation history appended only when required.

---

### Verified Workflow: Recalculate Pile (Force)
**Purpose**
Force recalculation (e.g., after pile type configuration changes).

**Actors**
- Authenticated engineer/admin.

**Preconditions**
- Pile is visible.

**Trigger**
- `POST /api/v1/piles/{id}/recalculate/`

**Main Flow**
1. `PileViewSet.recalculate()` calls `calculate_and_persist_pile()` with:
   - `trigger=PileCalculationHistory.TRIGGER_RECALCULATE`
   - `reason` from request data (default `"Manual recalculation"`)
2. Returns response containing:
   - `history_id`
   - `result` (via `result.to_dict()`)

**Alternative Flows**
- 400 on `ValueError` from calculation.

**Validation Rules**
- `reason` is read from request data; calculator exceptions surface as validation errors.

**State Transitions**
- `PileCalculationHistory.trigger == "recalculate"` and is tested in `tests/test_api.py`.

**Postconditions**
- A new history entry exists; current calculation updated.

---

### Verified Workflow: Get Pile Breakdown
**Purpose**
Return full calculation breakdown (engineering details).

**Actors**
- Authenticated users (permission + visibility applies).

**Trigger**
- `GET /api/v1/piles/{id}/breakdown/`

**Main Flow**
1. `PileViewSet.breakdown()` uses `PileCalculator.calculate(pile)` and returns `result.to_dict()`.

**Alternative Flows**
- 400 on `ValueError` from breakdown.
- 500 on unexpected exceptions.

**Postconditions**
- Read-only operation.

---

### Verified Workflow: Pile Calculation History (Immutable)
**Purpose**
Serve immutable calculation audit trail.

**Trigger**
- `GET /api/v1/piles/{id}/calculation-history/`

**Main Flow**
1. `PileViewSet.calculation_history()` fetches:
   - `pile.calculation_history.select_related("triggered_by")...`
2. Uses pagination (`paginate_queryset`) if applicable.
3. Serializes using `PileCalculationHistorySerializer`.

**State Transitions**
- None (read-only).

---

### Verified Workflow: Bulk Create Piles
**Purpose**
Create piles in one request, atomically.

**Actors**
- Authenticated engineer/admin.

**Trigger**
- `POST /api/v1/piles/bulk-create/`

**Main Flow**
1. `PileViewSet.bulk_create()` expects `request.data` to be a list.
2. Uses `transaction.atomic()` to ensure all-or-nothing behavior:
   - valid rows are serialized + saved
   - invalid rows accumulate `errors`
   - if `errors` exist, `transaction.set_rollback(True)`
3. Returns:
   - `created`: row status results
   - `errors`: per-row serializer errors and data

**Validation Rules**
- Serializer `is_valid()` decides validity.
- If payload is not a list => 400 `"Expected a list..."`

**State Transitions**
- Each created pile creates its own calculation history according to create flow.

**Error Conditions**
- 400 for invalid list payload or row validation errors.

---

### Verified Workflow: CSV Import
**Purpose**
Import pile schedules from uploaded CSV with dry-run support.

**Actors**
- Authenticated engineer/admin.

**Trigger**
- `POST /api/v1/piles/import-csv/`

**Main Flow**
1. `PileViewSet.import_csv()` reads uploaded file:
   - expects `file` in `request.FILES`
2. Reads CSV via `csv.DictReader` and uses serializer `PileCreateUpdateSerializer` per row.
3. Reads `dry_run` from either query param or request data:
   - dry_run is enabled when `dry_run` is truthy (1/true/yes)
4. Uses `transaction.atomic()`:
   - if dry_run or errors exist => `transaction.set_rollback(True)`
   - returns `created`, `errors`, and `dry_run`.

**Validation Rules**
- Row validation uses serializer rules (pile_no uniqueness, config existence, positive lengths, etc.).

**State Transitions**
- In dry-run: no DB writes.
- In non-dry-run with no errors: all rows persist.

**Error Conditions**
- 400 `"No file uploaded."` if no file.
- Validation errors appear per-row.

---

### Verified Workflow: BOQ Export CSV/XLSX
**Purpose**
Export BOQ for all piles visible to the user, or filtered queryset.

**Actors**
- Authenticated users with list visibility.

**Trigger**
- `GET /api/v1/piles/boq-export-csv/`
- `GET /api/v1/piles/boq-export-xlsx/`

**Main Flow**
1. Views build a queryset using selector-scoped `get_queryset()` plus optional filters.
2. CSV:
   - uses `PileSummarySerializer` results and writes a CSV header + rows.
3. XLSX:
   - builds an Excel workbook and writes header + rows.

**Alternative Flows**
- If no data, returns file with “No data” as content/header (validated in tests).

**Postconditions**
- No state changes.

---

## Project BOQ Generation Workflow

### Verified Workflow: Project BOQ Generation + Export CSV
**Purpose**
Generate BOQ totals and optionally export a CSV.

**Actors**
- Authenticated users with project visibility.

**Preconditions**
- Project exists and is visible.

**Trigger**
- `GET /api/v1/projects/{id}/boq/`
- `GET /api/v1/projects/{id}/boq-csv/`

**Main Flow**
1. `ProjectViewSet.boq()` calls `generate_boq(project, actor=request.user)`.
2. `boq_csv()` builds a CSV using the project’s piles; it reads `pile.calculation` if present.\n3. If `pile.calculation` is missing during CSV export, code attempts to repair missing calculations (via `calculate_and_persist_pile` and `PileCalculationHistory.TRIGGER_BOQ_REPAIR`), then proceeds.

**Validation Rules**
- When project has no piles: returns a structured payload indicating empty results.

**State Transitions**
- Read-only normally, but CSV export may cause calculation persistence repairs when `pile.calculation` is missing.

**Postconditions**
- BOQ payload or export file is produced.

---

## Execution Record Workflow

### Verified Workflow: Create Draft Driving Record
**Purpose**
Create a new driving record in DRAFT state.

**Actors**
- Authenticated engineer/admin with project visibility.

**Preconditions**
- Execution record relates to visible project/pile.

**Trigger**
- `POST /api/v1/execution/driving-records/` (routed under `/api/v1/execution/`)

**Main Flow**
1. `PileDrivingRecordViewSet.create()` uses `PileDrivingRecordSerializer`.
2. `perform_create()` calls `create_draft_driving_record(serializer.validated_data, request.user)`.

**Validation Rules**
- Serializer validates:
  - `project` and `pile` cannot be changed after draft creation (enforced in `apps/execution/serializers.py`).
  - validates resistance log sequencing and depth ordering when provided.

**State Transitions**
- New records start as DRAFT.

**Postconditions**
- Record exists; visible through selectors.

---

### Verified Workflow: Submit Execution Record
**Purpose**
Move a draft/returned record workflow to SUBMITTED by creating an immutable snapshot version.

**Actors**
- Authenticated user.

**Trigger**
- `POST /api/v1/execution/driving-records/{id}/submit/`

**Main Flow**
1. `PileDrivingRecordViewSet.submit()` delegates to:
   - `submit_execution_record(driving_record.execution_record, request.user)`
2. Invalid transitions return 409 with conflict.
3. Refreshes the record and returns updated serialized record.

**Error Conditions**
- 409 on invalid workflow transitions (`InvalidExecutionTransition`).

**Postconditions**
- Immutable version snapshot created (`ExecutionRecordVersion`) and record enters submitted workflow stage.

---

### Verified Workflow: Revise Execution Record (Returned)
**Purpose**
Apply contractor corrections to a returned mutable record and create a new immutable version.

**Actors**
- Authenticated user.

**Trigger**
- `POST /api/v1/execution/driving-records/{id}/revise/`

**Main Flow**
1. Serializer `partial=True` validation.
2. Calls:
   - `create_revision_from_record(driving_record.execution_record, request.user, revision_data=serializer.validated_data)`
3. Invalid transitions => 409 conflict.

**Error Conditions**
- 409 on invalid transitions or immutable record constraints.

**Postconditions**
- Record refreshed; revision creates new immutable snapshot version.

---

## Evidence Workflows

### Verified Workflow: Upload Evidence
**Purpose**
Upload evidence (photo/video/document/field_note/other) while preserving metadata and hash.

**Actors**
- Authenticated users.

**Preconditions**
- `EvidenceUploadSerializer` requires:
  - `project` and `file`

**Trigger**
- `POST /api/v1/evidence/upload/` (multipart)

**Main Flow**
1. `EvidenceItemViewSet.upload()` parses request via `EvidenceUploadSerializer`.
2. Calls `upload_evidence(serializer.validated_data, request.user)` returning:
   - `evidence` and `warnings` (warnings include deterministic duplicate hash reports).
3. Returns:
   - `evidence`: serialized evidence item
   - `warnings`: list of warning dicts

**Validation Rules (visible in serializer)**
- GPS latitude and longitude must be provided together (if one is set).
- Evidence type is a `ChoiceField` defaulting to `OTHER`.

**State Transitions**
- Creates evidence item metadata row.

**Postconditions**
- Evidence item exists and is visible via evidence selectors.

---

### Verified Workflow: Verify Evidence
**Purpose**
Update `verification_status` for an evidence item.

**Trigger**
- `POST /api/v1/evidence/{id}/verify/`

**Main Flow**
1. `EvidenceItemViewSet.verify()` validates request via `EvidenceVerifySerializer`.
2. Delegates to `verify_evidence(evidence, request.user, verification_status=...)`.
3. Returns updated evidence serialization.

**Validation Rules**
- verification_status can be `VERIFIED` or `REJECTED`.

---

### Verified Workflow: Link Evidence to Execution Version
**Purpose**
Create immutable link from evidence to an `ExecutionRecordVersion` snapshot.

**Trigger**
- `POST /api/v1/evidence/{id}/link/`

**Main Flow**
1. Validates request via `EvidenceLinkRequestSerializer`:
   - `execution_record_version` (PrimaryKeyRelatedField)
   - optional `is_primary` default false
2. Calls `link_evidence_to_version(...)` with `is_primary`.
3. Returns created link serialization.

**Error Conditions**
- 409 on `ValueError` from invalid link request.

---

## Verification Workflows

### Verified Workflow: Run Verification Checks
**Purpose**
Run deterministic rule engine against an immutable execution record version.

**Trigger**
- `POST /api/v1/verification/run-checks/{execution_record_version_id}/`

**Preconditions**
- Must refer to an existing `ExecutionRecordVersion`.

**Main Flow**
1. `RunVerificationChecksAPIView.post()` loads version via `get_object_or_404`.
2. Calls `run_verification_checks(version)`.
3. Returns:
   - `execution_record_version`: version id
   - `flags`: list of `VarianceFlag` serialized

**Alternative Flows**
- Idempotency: schema/description states rerunning does not recreate duplicates.

**Error Conditions**
- 404 if version missing.

**Postconditions**
- Variance flags created or reused; immutable run snapshot semantics.

---

### Verified Workflow: Variance Flag Transitions
**Purpose**
Transition a variance flag via verification workflow.

**Actors**
- Authenticated users with sufficient permission.

**Trigger**
- `POST /api/v1/verification/flags/{id}/acknowledge/`
- `POST /api/v1/verification/flags/{id}/resolve/`
- `POST /api/v1/verification/flags/{id}/waive/`

**Main Flow**
1. `_transition()` parses `VarianceFlagTransitionSerializer`:
   - optional `comment` (default "")
2. Calls service function:
   - `acknowledge_flag`
   - `resolve_flag`
   - `waive_flag`
3. Returns updated `VarianceFlag` serialization including:
   - `action_logs` (read-only)

**Error Conditions**
- 409 on `InvalidVarianceFlagTransition`.

**State Transitions**
- Flag `status` moves based on service logic (exact transitions are within service implementation and models).

---

## Approval Workflow

### Verified Workflow: Approve / Reject / Return for Correction / Consultant Comments
**Purpose**
Consultant workflow transitions against immutable `ExecutionRecordVersion`.

**Actors**
- Authenticated user.

**Trigger**
- `POST /api/v1/approvals/approve/`
- `POST /api/v1/approvals/reject/`
- `POST /api/v1/approvals/return-for-correction/`
- `POST /api/v1/approvals/comments/`

**Main Flow (shared)**
1. `_validated_request()` validates request with:
   - `ApprovalDecisionRequestSerializer`:
     - `execution_record_version` (int)
     - `comments` (default "")
2. Calls corresponding service function:
   - `approve_record_version`
   - `reject_record_version`
   - `return_record_for_correction`
3. Returns decision response serialized.

**Alternative Flows**
- `comments` action uses `ConsultantCommentRequestSerializer` and delegates to `review_service.add_consultant_comment`.

**Error Conditions**
- 409 if invalid workflow transition (`InvalidExecutionTransition` or `ValueError`).

**Postconditions**
- Decision recorded with append-only audit events/timeline (audit system enforced).

---

## Certification Package Workflow

### Verified Workflow: Certification Package Lifecycle
**Purpose**
Certification packages progress via explicit actions.

**Actors**
- Authenticated users.

**Trigger**
- `POST /api/v1/certification/packages/` (create)
- `PUT/PATCH /api/v1/certification/packages/{id}/` (update draft)
- `DELETE /api/v1/certification/packages/{id}/` (delete)
- Actions:
  - `POST /api/v1/certification/packages/{id}/add-line/`
  - `POST /api/v1/certification/packages/{id}/submit/`
  - `POST /api/v1/certification/packages/{id}/approve/`
  - `POST /api/v1/certification/packages/{id}/certify/`
  - `POST /api/v1/certification/packages/{id}/lock/`

**Main Flow**
1. `CertificationPackageViewSet.get_queryset()` uses visibility selector `visible_certification_packages_queryset`.
2. Create:
   - `perform_create()` delegates to `create_certification_package(...)`.
   - Errors: `IntegrityError` => 409 conflict.
3. Update draft:
   - calls `update_draft_package(...)` and returns serializer output.
   - errors: `ValueError`/`ValidationError` => 409 conflict.
4. Add line:
   - validates payload with `CertificationLineCreateSerializer`:
     - requires `source_execution_version` (PK field)
   - calls `add_certification_line(...)` and returns 201/409.
5. submit/approve/certify/lock:
   - calls respective service functions from `apps/certification/services/package_service.py`
   - errors: transition invalid => 409 conflict.

**Validation Rules**
- `CertificationPackageSerializer.validate_package_no` trims and rejects blank.
- `CertificationLineCreateSerializer` requires:
  - `pile`
  - `source_execution_version`
  - certified depth and quantity fields

**State Transitions**
- `CertificationPackage.current_state` is managed via actions.
- Supported states: `DRAFT`, `SUBMITTED`, `APPROVED`, `CERTIFIED`, `LOCKED` (choices in models and schema).

**Postconditions**
- Package lifecycle state updated; lines/quantities are populated with read-only snapshot structures.

---

### Verified Workflow: Package Locking
**Purpose**
Lock a certification package (terminal state).

**Trigger**
- `POST /api/v1/certification/packages/{id}/lock/`

**Main Flow**
- `lock()` calls `lock_package(self.get_object())` and returns package serialization.

**Error Conditions**
- 409 on invalid certification transition.

**Postconditions**
- Package enters `LOCKED` state (enforced by service + model choices).

---

## Audit Timeline Workflow

### Verified Workflow: Read Timeline Events (Project/Pile)
**Purpose**
Query immutable timeline events by scope.

**Actors**
- Authenticated users.

**Trigger**
- `GET /api/v1/audit/timeline/project/{project_id}/`
- `GET /api/v1/audit/timeline/pile/{pile_id}/`
- plus list/retrieve endpoints from router.

**Main Flow**
1. `TimelineEventViewSet.get_queryset()` returns selector-filtered `visible_timeline_events_queryset(self.request.user)`.
2. `project_timeline()` action calls `get_project_timeline(project_id)`, paginates, returns `TimelineEventSerializer`.
3. `pile_timeline()` action similarly calls `get_pile_timeline(pile_id)`.

**Validation Rules**
- 404 handling depends on timeline service implementations.

**State Transitions**
- None (read-only).

**Postconditions**
- Returns serialized immutable timeline event(s).

---

## BOQ Generation Workflow

### Verified Workflow: Piles BOQ Exports (CSV/XLSX)
**Purpose**
Generate exported BOQ from piles.

**Trigger**
- `GET /api/v1/piles/boq-export-csv/`
- `GET /api/v1/piles/boq-export-xlsx/`

**Main Flow**
- Builds queryset from visibility + optional filtering and serializes `PileSummarySerializer` into CSV or XLSX.

**State Transitions**
- No DB state changes in the visible export logic.

---

### Verified Workflow: Project BOQ Generation + CSV Export
**Purpose**
Project-level BOQ with aggregation.

**Trigger**
- `GET /api/v1/projects/{id}/boq/`
- `GET /api/v1/projects/{id}/boq-csv/`

**Main Flow**
- `boq()` uses `generate_boq(project, actor=request.user)`.
- `boq-csv()` iterates piles and includes calculation-derived totals; may repair missing calculations during export.

**State Transitions**
- Potential calculation persistence repair if `pile.calculation` is missing during CSV export (explicit in code path).

---

## Appendix: Verified endpoints visible from code/tests

- Schema/docs and schema generation validation:
  - `GET /api/schema/`, `GET /api/docs/`, `GET /api/redoc/`
  - validated in `tests/test_openapi_schema.py`
- Operational endpoints:
  - `GET /health/`
  - `GET /readiness/`
- Piles:
  - `POST /api/v1/piles/`
  - `PATCH /api/v1/piles/{id}/`
  - `POST /api/v1/piles/{id}/recalculate/`
  - `GET /api/v1/piles/{id}/breakdown/`
  - `GET /api/v1/piles/{id}/calculation-history/`
  - `POST /api/v1/piles/bulk-create/`
  - `POST /api/v1/piles/import-csv/` (dry run support)
  - `GET /api/v1/piles/boq-export-csv/`, `GET /api/v1/piles/boq-export-xlsx/`
- Projects:
  - `GET /api/v1/projects/{id}/boq/`
  - `GET /api/v1/projects/{id}/boq-csv/`
- Execution:
  - `POST /api/v1/execution/driving-records/{id}/submit/`
  - `POST /api/v1/execution/driving-records/{id}/revise/`
- Evidence:
  - `POST /api/v1/evidence/upload/`
  - `POST /api/v1/evidence/{id}/verify/`
  - `POST /api/v1/evidence/{id}/link/`
- Verification:
  - `POST /api/v1/verification/run-checks/{execution_record_version_id}/`
  - `POST /api/v1/verification/flags/{id}/acknowledge|resolve|waive/`
- Approvals:
  - `POST /api/v1/approvals/approve|reject|return-for-correction|comments/`
- Certification:
  - lifecycle actions on `/api/v1/certification/packages/{id}/...`
- Audit:
  - timeline queries under `/api/v1/audit/timeline/...`
