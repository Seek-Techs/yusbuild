# Security Architecture — YusBuild (repo-verified)

This document reverse-engineers security from the repository codebase. It avoids inventing features.

Legend:
- **Verified Facts**: explicitly present in code/config/tests.
- **Inferred Behavior**: strongly implied by code structure.
- **Recommendations**: non-executable guidance derived from verified design patterns.

---

## Security Philosophy

### Verified Facts
- All API endpoints inherit a default permission strategy unless a view overrides it.
- Default authentication is JWT (SimpleJWT).
- Data visibility is enforced both by:
  1) DRF permissions
  2) domain-specific selectors that scope querysets by authenticated user/project membership.

### Inferred Behavior
- Defense-in-depth: permission checks decide if the request can proceed, selectors reduce the data returned even for authorized users.

---

## Authentication

### Verified Facts
- `config/settings.py` sets:
  - `REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'] = ['rest_framework_simplejwt.authentication.JWTAuthentication']`

### Verified Facts (token endpoints)
- `config/urls.py` exposes:
  - `POST /api/auth/token/`
  - `POST /api/auth/token/refresh/`

---

## Authorization

### Default permissions

#### Verified Facts
- `REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES'] = ['apps.common.permissions.IsAdminEngineerOrReadOnly']`

#### Verified Facts: role model
- `apps/common/permissions.py::IsAdminEngineerOrReadOnly` defines:
  - `write_groups = {"admin", "engineer"}`
  - `read_groups = {"admin", "engineer", "viewer"}`

#### Verified Facts: request-level enforcement
- `has_permission()` denies when user is missing or unauthenticated.
- `has_permission()` allows all for `request.user.is_superuser`.
- For safe methods (GET/HEAD/OPTIONS): requires intersection with `read_groups`.
- For non-safe methods: requires intersection with `write_groups`.

#### Verified Facts: object-level enforcement
- `has_object_permission()`:
  - returns True for superusers
  - returns True for group `admin`
  - otherwise determines `project = getattr(obj, "project", obj)`
  - expects `project.memberships` exists
  - denies if membership for user is missing
  - for safe methods: allows only if membership.role in read_groups
  - for write methods: allows only if membership.role in write_groups

### Selector scoping

#### Verified Facts
- Views use domain selectors (e.g., `visible_projects_queryset`, `visible_piles_queryset`, `visible_evidence_items_queryset`, etc.) to restrict what is returned.

#### Inferred Behavior
- Even if an endpoint passes permission checks, selectors limit the queryset to what the user should see.

---

## API Security Surface

### Protected endpoints

#### Verified Facts
- Schema generation output indicates `jwtAuth` is used in `security` for multiple operations.
- `IsAdminEngineerOrReadOnly` enforces authentication for all non-safe operations.

### Anonymous endpoints

#### Verified Facts
- Operational endpoints are defined in `apps/common/views.py`:
  - `GET /health/`
  - `GET /readiness/`

These endpoints are accessible without JWT because they are not DRF viewsets with the default DRF permission class.

---

## Validation & Integrity

### Verified Facts: model-level immutability
- Execution record versions are immutable:
  - `apps/execution/models.py::ExecutionRecordVersion.save()` raises ValidationError if `self.pk` exists.
  - `delete()` raises ValidationError.
- Append-only audit models:
  - `apps/audit/models.py::AppendOnlyModel.save()` raises if updating existing rows.
  - `delete()` raises.

### Verified Facts: enforcement of editability
- Pile driving record edits depend on parent execution record state:
  - `apps/execution/models.py::PileDrivingRecord.save()` checks `execution_record.is_editable`.
- Evidence items and links enforce immutable fields and soft-delete semantics.
- Variance flags prevent edits to many critical fields via `save()` validation.

### Inferred Behavior
- Services rely on models’ invariants to prevent inconsistent state transitions.

---

## Sensitive Workflows (classified by evidence)

### Verified Facts (workflows implemented)
- Approvals: `apps/approvals/views.py` actions `approve`, `reject`, `return-for-correction`, `comments`.
- Certification lifecycle: `apps/certification/views.py` actions `submit`, `approve`, `certify`, `lock`, and `add-line`.
- Verification: `apps/verification/views.py` run checks endpoint + variance flag transitions.
- Evidence: `apps/evidence/views.py` actions `upload`, `verify`, `link`.
- Audit timeline: `apps/audit/views.py` actions for listing project/pile timeline.

### Verified Facts (error mapping)
- Views map invalid transitions to HTTP 409 via service/exception types such as:
  - `InvalidExecutionTransition`
  - `InvalidVarianceFlagTransition`
  - `InvalidCertificationTransition`

---

## Data Integrity & Trust Boundaries

### Verified Facts
- Database invariants and immutability are enforced by model `save()`/`delete()` methods.
- Services create new immutable snapshots/records rather than mutating history.

### Trust boundaries (verified by architecture)
- Client → API View (authN/authZ + validation)
- API View → Serializer (input normalization + validation)
- API View/Serializer → Services (workflow + persistence orchestration)
- Services/Models → Database (constraints + immutability checks)

---

## Attack Surface (repository-observed)

### Verified Facts (classes of risk addressed)
- Unauthorized access risk:
  - mitigated by default permission class + membership inference + selector scoping.
- State corruption risk:
  - mitigated by immutable/append-only model invariants.
- Tampering with history:
  - mitigated by append-only/audit immutability checks.

### Inferred Behavior
- Many endpoints are write-protected by group membership checks.

---

## Auditability

### Verified Facts
- Append-only audit/timeline domain models exist:
  - `AuditEvent` and `TimelineEvent` extend `AppendOnlyModel`.

### Inferred Behavior
- Workflow services append events to keep traceable decision history.

---

## Security Assumptions (explicit)

### Inferred Behavior
- Correct functioning assumes:
  - selectors correctly scope visibility by membership
  - object-level permission can resolve `obj.project` for project-owned objects

---

## Known Limitations (based on what is visible)

### Inferred Behavior
- Not all viewsets override permissions; default permission is used widely.
- If a new model/object lacks a `.project` attribute and the permission class relies on `getattr(obj, "project", obj)`, object-level enforcement may be incomplete unless the object is structured similarly.

---

## Recommendations (no new security claims)

- When adding new project-owned models/endpoints:
  - ensure the object exposes a `project` relationship or can be resolved by permission logic.
  - implement visibility in selectors and use them in `get_queryset()`.
- When adding immutable/append-only history:
  - follow existing patterns from `AppendOnlyModel` and version immutability constraints.

