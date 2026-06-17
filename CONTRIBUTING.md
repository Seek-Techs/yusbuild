# Contributing to YusBuild (repo-verified standards)

This document captures contribution standards derived from the existing repository architecture and codebase. It is **not** a generic GitHub guide.

## Development Philosophy

### 1) Preserve the domain boundaries
YusBuild is organized by domain “apps” under `apps/` (e.g., `apps/piles`, `apps/projects`, `apps/execution`, `apps/evidence`, `apps/verification`, `apps/certification`, `apps/audit`, `apps/approvals`). Each domain exposes APIs via DRF viewsets and implements business behaviors primarily in `services/` and read behaviors in `selectors.py`.

### 2) Make writes explicit and traceable
Write operations (create/update/transition actions) generally:
- validate through serializers
- perform workflow or business logic in services
- persist immutable history/audit records where required (e.g., `apps/audit/models.py` uses an append-only model)

### 3) Treat views as orchestration glue
Views should mainly:
- bind request/response
- select serializer
- call service/selector helpers
- return responses / HTTP status codes

### 4) Enforce authorization via selectors + permissions

Authorization is handled at two layers:
- **DRF permission class**: `apps/common/permissions.py::IsAdminEngineerOrReadOnly`
- **query scoping via selectors**: `apps/*/selectors.py` restricts visible rows based on project membership

Your contribution must respect both—don’t bypass selectors by re-querying across the model layer without scoping.

## Repository Structure

Top-level:
- `config/`: Django settings + URL routing + schema docs wiring
- `apps/`: domain modules
- `tests/`: pytest suite validating behaviors end-to-end at the API layer and schema generation
- `docs/`: architecture and phase notes

Domain layout pattern (consistent across apps):
- `models.py`: domain entities + invariants
- `selectors.py`: read/query helpers enforcing visibility
- `serializers.py`: input/output serialization + request validation
- `views.py`: DRF viewsets/actions wiring to services/selectors
- `urls.py`: DRF router registration
- `services/`: business logic/workflows/calculation persistence

## Coding Standards

### Naming conventions (observed)
- Modules:
  - `selectors.py` for read/query scoping
  - `services/` for business logic
- Functions:
  - Verb-named helpers in services (e.g., `calculate_and_persist_pile`, `create_draft_driving_record`, `run_verification_checks`)
  - Query functions in selectors prefixed with `visible_..._queryset` or similar.
- Classes:
  - DRF viewsets end with `ViewSet` (e.g., `PileViewSet`, `EvidenceItemViewSet`)
  - Custom APIView subclasses are named explicitly (e.g., `RunVerificationChecksAPIView`)

### File organization (enforced by review)
- Put **write/business logic** in `services/`.
- Put **read/query logic with visibility** in `selectors.py`.
- Keep **views thin**.
- Keep serializers focused on validation + shape.

### Formatting
- Ruff is configured via `pyproject.toml` / `ruff` settings.
- Keep line length consistent (`ruff` line-length = 88).

### Imports
- Prefer explicit imports from the same domain.
- Avoid cross-domain leakage: selectors and services should reference only what they need.

### Typing
- Use type annotations in selectors (many are annotated with `QuerySet[...]` and dataclasses for contexts).
- Services commonly use type annotations for returned values.

### Documentation
- Code docs exist and should be continued.
- Serialize/endpoint docs rely on DRF + drf-spectacular schema generation (see `tests/test_openapi_schema.py`).

## Service Layer Rules

### Where business logic belongs
Business logic belongs in `services/` and/or `apps/*/services.py` (when a file-level service module is used).

Examples from the codebase:

1) Pile calculations + persistence
- View calls service: `apps/piles/views.py`
- Persistence/workflow lives in `apps/piles/services.py`
  - `calculate_and_persist_pile(pile, triggered_by, trigger, reason)`
  - snapshots inputs/config/constants into `PileCalculationHistory`

2) Evidence workflow
- Evidence view actions call `apps/evidence/services/evidence_service.py`
  - `upload_evidence(...)`
  - `verify_evidence(...)`
  - `link_evidence_to_version(...)`

3) Verification checks and transitions
- `apps/verification/views.py` calls `run_verification_checks(version)` and transition services:
  - `acknowledge_flag`, `resolve_flag`, `waive_flag`

### What must NOT be in views/serializers
- Business workflow transitions
- Complex orchestration (beyond parameter binding and returning HTTP responses)
- Calculation/persistence logic (except calling service functions)

### Service style expectations
- Services should be deterministic where possible (verification checks explicitly describe idempotency in schema/docs).
- Services should return values suitable for serializers.

## Selector Layer Rules

### Read operations with visibility live in selectors
Selectors exist to answer:
- “Which rows are visible to this authenticated user?”
- “Which query shape should we use (joins/select_related/prefetch_related/distinct)?”

Examples:

1) Project visibility scoping
- `apps/projects/selectors.py::visible_projects_queryset(user)`
  - superuser/admin group can see all projects
  - otherwise, projects where membership exists

2) Pile visibility scoping
- `apps/piles/selectors.py::visible_piles_queryset(user)`
  - filters by `project__memberships__user=user` unless admin/superuser

3) Execution record version scoping
- `apps/execution/selectors.py::visible_execution_record_versions_queryset(user)`

### Selector responsibilities (explicit)
- Enforce project membership scoping
- Provide querysets that views can safely paginate/filter/summarize

### Selector vs service
- Selectors are for **reads**.
- Services are for **writes** and workflow.

If you need both, split it:
- selector returns visible entities
- service performs transition or persistence

## Views

### Why views should remain thin
Views should not contain domain logic; they orchestrate.

What the repository does:
- views mostly:
  - use `get_queryset()` with `visible_*_queryset(user)` selectors
  - call services from action methods
  - choose serializers
  - handle HTTP statuses and error mapping

Examples:
- `apps/piles/views.py::recalculate()` calls `calculate_and_persist_pile(...)`.
- `apps/evidence/views.py::upload()` calls `upload_evidence(...)` and returns `EvidenceItemSerializer(...)`.
- `apps/verification/views.py` defines `_transition()` and delegates transition logic to service functions.

### What should exist in views
- DRF configuration glue:
  - router registration
  - serializer selection
  - filter/search/order config
  - request->validated_data->service call

### What should NOT exist in views
- Direct model mutation beyond trivial persistence already encapsulated in services
- Complex multi-step business orchestration
- Query logic that is not in selectors (avoid duplicating visibility filters)

## Serializers

### Responsibilities
Serializers handle:
- Input validation (e.g., `PileCreateUpdateSerializer.validate_*` checks)
- Output shapes (serializers used by views/actions)
- Converting inputs to internal types (e.g., `to_internal_value` normalization in piles)

### Limitations
- Avoid placing business logic in serializer methods beyond validation/normalization.
- When serializer methods need to trigger calculations/writes, prefer delegating to the already-defined services/helper functions.

In the codebase:
- Pile serializer runs calculation persistence in `_run_calculation()` and uses the service `calculate_and_persist_pile()` for persistence.

This is acceptable because persistence logic is still delegated.

## Models

### Domain ownership
Models define domain invariants and persistence constraints.

Examples:
- `apps/projects/models.py` defines `ProjectMembership` roles and enforces uniqueness (`UniqueConstraint(fields=["project","user"])`).
- `apps/audit/models.py` defines `AppendOnlyModel` invariants:
  - cannot update/delete existing rows
  - `save()` raises if `self.pk` is already set

### What to keep in models
- field definitions
- constraints (unique/index)
- invariants (e.g., append-only behavior)

### What to avoid in models
- complex cross-domain orchestration

## Adding a New Domain

A “domain” means a new `apps/<domain_name>/` module with an API and associated visibility rules.

### Required files and structure
At minimum, follow the existing pattern:
- `apps/<domain_name>/models.py`
- `apps/<domain_name>/selectors.py` (visibility/read)
- `apps/<domain_name>/serializers.py`
- `apps/<domain_name>/views.py`
- `apps/<domain_name>/urls.py` (DRF router registration)
- optionally `apps/<domain_name>/services/` for business logic/workflows

### Router registration
- Domain `urls.py` should register viewsets/actions with DRF routers.
- Domain urls are included from `config/urls.py`.

### Permission + scoping integration
- Ensure selectors scope queries by project membership the same way as other domains.
- Ensure views use those selectors in `get_queryset()` (and for action endpoints that depend on visibility).

### Schema/docs
- Ensure endpoints are covered and schema generation remains clean (see `tests/test_openapi_schema.py`).

## Testing Requirements

YusBuild uses pytest and validates:
- API behaviors (CRUD + custom actions)
- schema generation
- workflow integrity
- importer/exporter correctness

### Unit tests
- Prefer unit tests for pure logic/helpers (if the code introduces such helpers).
- Existing unit tests include importer behaviors in `tests/test_import_export_stabilization.py`.

### Integration/API tests
- API tests are in `tests/test_api.py` and workflow tests.
- When adding endpoints, add tests that:
  - create required objects
  - call endpoint
  - assert response fields
  - assert audit/history side effects where applicable

### Coverage expectations
- CI enforces `pytest` with `--cov-fail-under=85` and `pytest.ini` uses `--cov=apps`.
- Maintain coverage; aim for new code to be directly exercised.

## Pull Request Checklist

Before merging, ensure:

### Architecture consistency
- [ ] Business logic lives in `services/` (not in views or serializer methods)
- [ ] Read/query logic with authorization scoping lives in `selectors.py`
- [ ] Views remain orchestration glue

### API & schema
- [ ] Endpoint is registered in `urls.py` and included under `/api/v1/` routing
- [ ] drf-spectacular schema generation remains clean (`tests/test_openapi_schema.py`)

### Authorization
- [ ] New code uses existing permission class semantics (`IsAdminEngineerOrReadOnly`) and selector scoping
- [ ] No cross-domain leakage (don’t fetch objects without applying visibility filters)

### Tests
- [ ] New tests added for the new endpoint/behavior
- [ ] Existing tests still pass
- [ ] Coverage target maintained (85% minimum)

### Code quality
- [ ] Ruff lint/format passes

## Common Anti-patterns

Avoid these patterns because they conflict with the repository’s architecture:

1) Fat views
- Don’t implement workflow state machines inside `views.py`.
- Delegate to `services/`.

2) Business logic in serializers
- Serializers should validate/normalize input and shape output.
- If it’s real workflow logic, move it to services.

3) Cross-domain leakage
- Don’t query unrelated models without scoping.
- Always go through the domain selectors or explicitly apply equivalent membership filters.

4) Duplicate queries
- Avoid re-performing visibility filtering that selectors already provide.
- Use the selector-provided queryset in `get_queryset()`.

5) Generic utility abuse
- Don’t add “catch-all” helpers in random modules.
- Keep helpers close to the domain they serve (services/selectors).

6) Ignoring immutability/audit invariants
- Audit models (`AppendOnlyModel`) enforce immutability—don’t try to mutate audit rows.

---

By following these standards, contributions will remain consistent with YusBuild’s domain-driven boundaries, selector/service architecture, and DRF + drf-spectacular API model.

