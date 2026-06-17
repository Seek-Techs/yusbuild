# Architecture Decision Records (ADRs) — YusBuild

Each ADR documents **why** a major architectural decision was made (based on visible repository evidence). Status values:
- **Accepted**: directly implemented
- **Inferred**: strongly implied by architecture/code patterns
- **Deprecated**: replaced by a later approach (none identified with confidence in this repo snapshot)

---

## ADR-001 Domain-Oriented Architecture

# ID
ADR-001

# Title
Domain-oriented Django apps (apps/*) with explicit boundaries

# Status
Accepted

# Context
The project spans multiple engineering workflows: projects/piles, execution records, evidence, verification, certification, approvals, and audit timelines.

# Decision
Implement each workflow area as a dedicated Django app under `apps/` and expose the corresponding API via that app’s `views.py` + `urls.py` router.

# Consequences
- Advantages:
  - Clear ownership boundaries for models/logic
  - Easier onboarding for engineers by domain
- Trade-offs:
  - Cross-domain workflow changes require careful coordination
  - Requires consistent patterns (selectors/services) to prevent leakage

Evidence:
- `config/urls.py` includes `apps.*.urls` for `/api/v1/<domain>/`.

---

## ADR-002 Service Layer Pattern

# ID
ADR-002

# Title
Business logic resides in services/*, not in views/serializers

# Status
Accepted

# Context
DRF provides request/response glue (views/serializers), but workflow logic must be deterministic, testable, and consistent.

# Decision
Delegate domain behaviors to service modules. Views call service functions; serializers delegate persistence/calculation to service helpers.

# Consequences
- Advantages:
  - Keeps views thin and focused on HTTP concerns
  - Improves unit testability of business logic
  - Centralizes workflow transitions and persistence
- Trade-offs:
  - More files/modules
  - Requires contributors to learn service boundaries

Evidence:
- Piles: `apps/piles/services.py::calculate_and_persist_pile()` called from `apps/piles/views.py`.
- Evidence: `apps/evidence/services/evidence_service.py` called from `apps/evidence/views.py`.
- Verification transitions: `apps/verification/services/*` called from `apps/verification/views.py`.

---

## ADR-003 Selector Pattern for Read Visibility Scoping

# ID
ADR-003

# Title
Visibility and read-query shaping via selectors.py

# Status
Accepted

# Context
Endpoints must enforce project-level visibility and avoid accidental cross-project data exposure.

# Decision
Use `selectors.py` modules to implement query scoping based on authenticated user and project membership, returning querysets used by views.

# Consequences
- Advantages:
  - Makes visibility rules reusable and auditable
  - Standardizes `get_queryset()` across endpoints
- Trade-offs:
  - Contributors must route new read logic through selectors

Evidence:
- `apps/projects/selectors.py::visible_projects_queryset()`.
- `apps/piles/selectors.py::visible_piles_queryset()`.
- `apps/execution/selectors.py`, `apps/evidence/selectors.py`, `apps/audit/selectors.py`, `apps/certification/selectors.py`, `apps/verification/selectors.py`.

---

## ADR-004 Default Permission Strategy

# ID
ADR-004

# Title
JWT + group-based permission with object-level membership inference

# Status
Accepted

# Context
The system requires authorization for create/update/delete while allowing read access for viewers and full access for admin/engineer groups.

# Decision
Use `IsAdminEngineerOrReadOnly` as `DEFAULT_PERMISSION_CLASSES` and implement object-level permission checks based on the user’s groups and an inferred `project` attribute when available.

# Consequences
- Advantages:
  - Enforces read vs write consistently across endpoints
  - Supports role differentiation using Django groups
- Trade-offs:
  - Object-level permission inference may not cover every edge case for new models unless they expose a `project` relationship

Evidence:
- `config/settings.py` sets `REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES']`.
- `apps/common/permissions.py` implements `has_permission` and `has_object_permission`.

---

## ADR-005 JWT Authentication

# ID
ADR-005

# Title
Use SimpleJWT for bearer authentication

# Status
Accepted

# Context
Endpoints must be protected and integrate cleanly with mobile/web clients.

# Decision
Use `rest_framework_simplejwt.authentication.JWTAuthentication` as the default authentication and expose token obtain/refresh endpoints.

# Consequences
- Advantages:
  - Standard token workflow
  - Compatibility with OpenAPI schema generation
- Trade-offs:
  - Token lifecycle management required by clients

Evidence:
- `config/settings.py` default authentication class.
- `config/urls.py` registers `POST /api/auth/token/` and `POST /api/auth/token/refresh/`.

---

## ADR-006 drf-spectacular OpenAPI

# ID
ADR-006

# Title
Schema-first API documentation with drf-spectacular

# Status
Accepted

# Context
The project requires reliable, generated API documentation aligned with actual endpoints.

# Decision
Configure `drf_spectacular` and expose schema + documentation views, and enforce schema generation in tests.

# Consequences
- Advantages:
  - Keeps docs consistent with runtime behavior
  - Enables client integration using generated schemas
- Trade-offs:
  - Contributors must ensure schema generation remains clean (no serializer/schema errors)

Evidence:
- `config/settings.py` `DEFAULT_SCHEMA_CLASS` and `SPECTACULAR_SETTINGS`.
- `config/urls.py` exposes `/api/schema/`, `/api/docs/`, `/api/redoc/`.
- `tests/test_openapi_schema.py` asserts key paths exist in generated schema.

---

## ADR-007 Thin Views via Router + Action Pattern

# ID
ADR-007

# Title
DRF routers with custom @action endpoints and minimal HTTP glue

# Status
Accepted

# Context
The API exposes both CRUD and workflow actions (submit/revise/verify/approve/recalculate/etc.).

# Decision
Use DRF `ViewSet` + router registrations for CRUD and `@action` for workflow endpoints, while keeping views as thin orchestration glue calling services.

# Consequences
- Advantages:
  - Uniform endpoint structure
  - Clear grouping in OpenAPI schema
- Trade-offs:
  - Requires discipline to avoid business logic creep into views

Evidence:
- `apps/piles/views.py` uses actions `bulk-create`, `import-csv`, `recalculate`, `breakdown`, and exports.
- `apps/evidence/views.py` uses `upload`, `verify`, `link` actions.
- `apps/verification/views.py` uses `@action` transitions.

---

## ADR-008 Audit Timeline via Append-Only Models

# ID
ADR-008

# Title
Immutability and traceability using append-only audit models

# Status
Accepted

# Context
Engineering workflows require traceable, non-editable history (decisions, events, timeline).

# Decision
Implement `AppendOnlyModel` that prevents updates/deletes by raising validation errors when `pk` exists.

# Consequences
- Advantages:
  - Strong integrity guarantees for audit timeline
  - Simplifies reasoning about historical correctness
- Trade-offs:
  - Requires new audit behaviors to be implemented as append-only creation

Evidence:
- `apps/audit/models.py` `AppendOnlyModel.save()` and `.delete()`.
- Audit serializers include actor/project/pile/event fields.

---

## ADR-009 Pile Calculation Persistence with Snapshots

# ID
ADR-009

# Title
Store calculation outputs plus immutable input/config/constants snapshots

# Status
Accepted

# Context
Engineering quantities must be reproducible even after configurations/constants change.

# Decision
On calculation (create/update/recalculate), persist or update current calculation and append `PileCalculationHistory` with snapshots: inputs/config/constants/result.

# Consequences
- Advantages:
  - Reproducibility and auditability
  - Ability to serve calculation history endpoints
- Trade-offs:
  - More storage and slightly more complex persistence logic

Evidence:
- `apps/piles/services.py::calculate_and_persist_pile()` constructs `build_input_snapshot`, `build_config_snapshot`, `build_constants_snapshot` and writes `PileCalculationHistory`.
- Views expose history via `GET /api/v1/piles/{id}/calculation-history/`.

---

## ADR-010 Workflow Separation: Execution → Approval/Verification → Certification

# ID
ADR-010

# Title
Multi-stage workflow implemented across domains

# Status
Inferred

# Context
There are distinct workflow concerns:
- execution records (submit/revise)
- consultant decisions (approve/reject/return for correction)
- deterministic verification rules (run checks)
- certification package lifecycle (submit/approve/certify/lock)

# Decision
Split workflow stages across separate apps with dedicated APIs and serializers, connected by immutable snapshots (e.g., execution record versions referenced by evidence/verification/certification).

# Consequences
- Advantages:
  - Cleaner separation of responsibilities
  - Easier to enforce immutability per stage
- Trade-offs:
  - Requires careful reference management across apps

Evidence:
- Execution: `apps/execution/views.py` submit/revise actions.
- Approvals: `apps/approvals/views.py` actions target immutable `ExecutionRecordVersion`.
- Verification: `apps/verification/views.py` runs checks against `ExecutionRecordVersion` snapshots.
- Certification: `apps/certification/views.py` transitions per package.

---

## ADR-011 Test Coverage Policy

# ID
ADR-011

# Title
Enforce CI and quality by requiring 85%+ coverage

# Status
Accepted

# Context
To keep architecture consistent and prevent regressions, the repo enforces a coverage threshold.

# Decision
Require `pytest-cov` to enforce `--cov-fail-under=85` and run ruff lint/format checks in CI.

# Consequences
- Advantages:
  - Prevents large untested changes
- Trade-offs:
  - Some low-level modules may remain partially uncovered (acceptable if tests focus on behavior)

Evidence:
- `pytest.ini` includes `--cov-fail-under=85`.
- `.github/workflows/ci.yml` runs ruff checks, migrations checks, and pytest.

---

## ADR-012 Health/Readiness Operational Endpoints

# ID
ADR-012

# Title
Operational endpoints for liveness and readiness

# Status
Accepted

# Context
Deployments require health signals for load balancers and orchestration.

# Decision
Provide `GET /health/` and `GET /readiness/` endpoints; readiness checks both DB connectivity and migration state.

# Consequences
- Advantages:
  - Safer rollout by failing fast when DB/migrations aren’t ready
- Trade-offs:
  - Readiness adds DB/migration checks at request time

Evidence:
- `apps/common/views.py::health_check` and `readiness_check`.
- Routes registered in `config/urls.py`.

---

## ADR-013 Multi-format Schema Endpoint

# ID
ADR-013

# Title
Schema endpoint supports YAML and JSON via content negotiation

# Status
Accepted

# Context
Clients integrate using different schema formats.

# Decision
Expose schema at `/api/schema/` with drf-spectacular supporting `format=json|yaml`.

# Consequences
- Advantages:
  - Better tooling compatibility
- Trade-offs:
  - Slightly more configuration complexity

Evidence:
- `tests/test_openapi_schema.py` uses drf-spectacular management command; schema endpoint includes `format` query parameter in schema.
- `config/urls.py` exposes schema view.

---

## ADR-014 Routing Organization

# ID
ADR-014

# Title
URL routing under /api/v1 via domain routers and config includes

# Status
Accepted

# Context
Endpoints must be organized consistently and discovered via schema.

# Decision
Use DRF routers per domain and include them in `config/urls.py` under `/api/v1/<domain>/`.

# Consequences
- Advantages:
  - Consistent URL discoverability
  - Easier schema grouping in drf-spectacular tags
- Trade-offs:
  - Contributors need to follow router patterns when adding endpoints

Evidence:
- `config/urls.py` includes `apps.projects.urls`, `apps.piles.urls`, etc.
- Each app’s `urls.py` uses `DefaultRouter()`.

