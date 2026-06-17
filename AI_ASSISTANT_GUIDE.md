# AI Assistant Guide — YusBuild Coding Agents

## Purpose
This guide exists to preserve YusBuild’s architectural integrity when AI agents generate code. It converts repository evidence into “guardrails” that prevent inconsistent patterns.

The rules below are **not generic**. They are derived from:
- actual `apps/*` layout
- `selectors.py`, `services/*`, `views.py`, `serializers.py`
- `apps/common/permissions.py` authorization behavior
- `tests/` expectations
- drf-spectacular schema generation + schema tests
- repository ADRs and documentation set: `ARCHITECTURE.md`, `DECISIONS.md`, `DEVELOPMENT_GUIDE.md`, `WORKFLOWS.md`, `EVENTS.md`, `PERMISSIONS.md`, `DATA_MODEL.md`, `SECURITY.md`

---

## Architectural Philosophy

### Verified Repository Rules
1. **Domain separation via Django apps**
   - Work happens inside `apps/<domain>/`.
   - Each domain exports its HTTP surface via router registration in `apps/<domain>/urls.py`.

2. **Business logic in services**
   - Views delegate workflow/persistence to `services/` or domain service modules.

3. **Read visibility in selectors**
   - Query scoping is implemented in `selectors.py` and used by views in `get_queryset()`.

4. **Views are orchestration only**
   - Views coordinate serializers, permissions, pagination, and service invocation.

5. **Auditability is append-only**
   - Audit/timeline records use append-only models (`AppendOnlyModel`) and must not be modified.

### Inferred Practices
- The repository uses immutable/versioned patterns (execution versions, pile calculation history) to preserve traceability.
- Schema/doc correctness is treated as a first-class test concern.

---

## Repository Structure

### Verified Backend Layout
- `config/`
  - Django settings
  - URL routing (`config/urls.py`)
  - drf-spectacular schema + docs endpoints wiring
- `apps/`
  - `projects`, `piles`, `execution`, `evidence`, `verification`, `certification`, `approvals`, `audit`, and `common`
- `tests/`
  - API tests
  - workflow tests
  - OpenAPI schema generation test

### Frontend
- A Vite/React frontend exists under `yusbuild/`.
- This guide focuses on backend integrity.

---

## Service Layer Rules

### Verified Repository Rule
Business/workflow logic belongs in `services/`.

### Do NOT place business rules in
- `views.py`
- `serializers.py`

### Evidence/examples (verified)
- Piles:
  - `apps/piles/views.py` calls calculation persistence implemented in `apps/piles/services.py`.
- Evidence:
  - `apps/evidence/views.py` delegates to `apps/evidence/services/evidence_service.py`.
- Verification:
  - `apps/verification/views.py` delegates transitions/checks to `apps/verification/services/*`.
- Approval & Certification:
  - `apps/approvals/services/*` and `apps/certification/services/*` handle workflow transitions and recording.

### Guardrails for AI agents
- If code needs:
  - state transitions
  - persistence beyond standard `serializer.save()`
  - version/history creation
  - calling audit/timeline record functions
  - snapshotting

  → move it into `services/`.

---

## Selector Layer Rules

### Verified Repository Rule
Read responsibilities belong in `selectors.py`.

### Responsibilities (verified)
- Provide `visible_*_queryset(user)` functions.
- Implement joins/`select_related`/`prefetch_related`/`distinct` patterns appropriate to the queryset.

### Guardrails
- Views must not re-implement visibility rules inline.
- When new read endpoints are added:
  - create a selector function and call it in `get_queryset()`.

---

## View Rules

### Verified Repository Rule
Views remain thin.

### Views should do
- Request handling:
  - select serializer class
  - handle DRF action routing
  - map exceptions to HTTP statuses
- Permission integration is defaulted via DRF.
- Service invocation

### Views should avoid
- complex workflow logic
- heavy query construction (prefer selectors)
- domain invariants enforcement (prefer models/services)

---

## Serializer Rules

### Verified Repository Rule
Serializers perform validation and representation.

### What serializers must do
- Validate inputs and normalize/coerce types.
- Define output shapes.

### What serializers should avoid
- Orchestration and multi-step workflows.
- Calling audit/timeline recording logic directly unless the repository already does so.

---

## Model Rules

### Verified Repository Rule
Models represent entities and invariants.

### Guardrails
- Invariants (immutability, append-only behavior, uniqueness constraints) must remain in `models.py`.
- Do not introduce service-like orchestration methods in models.

### Evidence (verified)
- Execution record versions are immutable.
- Append-only audit models prevent update/delete.
- Evidence items enforce immutability on key fields.

---

## Permission Rules

### Verified Repository Rule
Authorization uses:
- default DRF permission: `apps/common/permissions.py::IsAdminEngineerOrReadOnly`
- object-level permission checks and group membership roles
- selectors for read scoping

### Guardrails
- Never bypass permission logic by using unscoped querysets.
- For new endpoints that work on project-owned objects, enforce selector scoping + rely on object-level permission resolution.

---

## Workflow Rules

### Verified Repository Rule
Preserve existing state transitions.

### Guardrails
- Do not shortcut around:
  - approvals
  - verification
  - certification
  - evidence
  - audit timeline recording

### Audit/event recording
- If a workflow action already records events via audit/timeline services, preserve that.
- Do not remove append-only behavior.

---

## Event Rules

### Verified Repository Rule
Maintain auditability and append-only records.

### Guardrails
- Preserve calls to audit/timeline recording services.
- Do not mutate audit/timeline rows after creation (enforced by models).

---

## Testing Expectations

### Verified Repository Policy
- CI enforces:
  - ruff lint/format
  - migration checks
  - pytest
  - minimum coverage of 85%
- OpenAPI schema generation is tested.

### Guardrails
- All changes must include tests.
- Update/extend workflow + endpoint tests as needed.

---

## Performance Expectations

### Verified Repository Patterns
- Reuse selectors to preserve scoping.
- Keep ORM optimization patterns (`select_related`, `prefetch_related`, pagination).
- Preserve bulk import/export patterns (transactions, rollback behavior).

### Guardrails
- Avoid N+1 queries by following existing queryset optimization patterns.

---

## Common Anti-Patterns

### Verified Anti-pattern categories from repository conventions
- Fat views
- Business logic in serializers
- Cross-domain leakage (querying across domains without selectors)
- Generic utility abuse
- Duplicated queries (not reusing selectors)
- Hidden side effects (e.g., state changes in unexpected places)
- Skipping audit/timeline recording in workflow actions
- Bypassing services

---

## Adding New Features: Recommended Workflow

1. Define domain ownership.
2. Add/extend models with invariants.
3. Add services for business/workflow logic.
4. Add selectors for read scoping.
5. Add serializers for validation + representations.
6. Add views that orchestrate request/response.
7. Register routes under the relevant `apps/<domain>/urls.py` router.
8. Write tests (API/workflow/schema as relevant).
9. Update schema if endpoint shapes change (schema generation test ensures consistency).
10. Update documentation only where required by the repository pattern.

---

## Before Making Changes (AI agent checklist)

Consult, in order:
1. `ARCHITECTURE.md`
2. `DECISIONS.md`
3. `DEVELOPMENT_GUIDE.md`
4. `WORKFLOWS.md`
5. `EVENTS.md`
6. `PERMISSIONS.md`
7. `DATA_MODEL.md`
8. `SECURITY.md`

Then implement using the service/selector/view/serializer/model boundaries above.

---

## Golden Rules (must not be violated)

### Verified Repository Rules
- Business logic → services.
- Visibility-scoped reads → selectors.
- Views are thin orchestration.
- Invariants/immutability → models.
- Workflow actions preserve auditability via append-only recording.
- Tests must be added and schema generation must remain clean.

### Inferred Practices
- Immutable/versioned history supports traceability and should be preserved for correctness.

### Recommendations
- Reuse existing patterns and helper functions rather than introducing new “generic utilities” unless they match the domain.

