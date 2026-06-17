# Permissions & Access Control — YusBuild (verified behavior)

This document reverse-engineers authorization from the repository codebase.

## Permission Philosophy

### Verified Facts
- DRF uses a single default permission class:
  - `config/settings.py` → `REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES'] = ['apps.common.permissions.IsAdminEngineerOrReadOnly']`.
- Authorization is enforced in two layers:
  1. **Request-level permission** (`has_permission`)
  2. **Object-level permission** (`has_object_permission`)
- Role model is derived from Django **groups**:
  - `apps/common/permissions.py::IsAdminEngineerOrReadOnly`
    - write groups: `admin`, `engineer`
    - read groups: `admin`, `engineer`, `viewer`

### Inferred Behavior (explicitly implied)
- Users without the required group for the request method receive permission denial.
- For objects that expose a `project` attribute, object-level permission uses project membership.

---

## Default Permission Strategy

### Verified Facts
- `IsAdminEngineerOrReadOnly.has_permission()`:
  - returns `False` when user is missing or not authenticated.
  - returns `True` for `request.user.is_superuser`.
  - for safe methods (`GET`, `HEAD`, `OPTIONS`), returns whether user has any group in `{admin, engineer, viewer}`.
  - for non-safe methods (`POST`, `PUT`, `PATCH`, `DELETE`), returns whether user has any group in `{admin, engineer}`.

---

## Authentication Requirements

### Verified Facts
- JWT authentication is defaulted in `config/settings.py`:
  - `rest_framework_simplejwt.authentication.JWTAuthentication`

### Verified Facts (permission gate)
- `has_permission()` denies unauthenticated users.

---

## Endpoint-Level Permissions

### Verified Facts
- Unless a view overrides permissions, endpoints inherit the default permission class.

### Verified Facts (schema endpoint)
- The OpenAPI schema endpoint is protected by schema security blocks in `schema.yaml` (presence of `securitySchemes.jwtAuth` and default `jwtAuth` usage in schema shows schema requires JWT for operations that specify security).

---

## Object-Level Permissions

### Verified Facts
- `IsAdminEngineerOrReadOnly.has_object_permission()`:
  - returns `False` if user missing/not authenticated
  - returns `True` for superusers
  - if user is in `admin` group, returns `True`
  - else:
    - obtains `project = getattr(obj, 'project', obj)`
    - expects `project.memberships` to exist
    - if `memberships is None`:
      - allows only safe methods when user in read groups.
    - finds `membership = memberships.filter(user=user).first()`
    - denies if membership is missing
    - for safe methods: allows only if `membership.role` is in read groups
    - for write methods: allows only if `membership.role` is in write groups

---

## Ownership Rules

### Verified Facts
- Object-level access uses a derived project membership:
  - When object has `.project`, membership is resolved against `obj.project`.
  - When object doesn’t, membership is attempted against the object itself (`project = obj`).

---

## Cross-Domain Access Rules

### Verified Facts
- The permission class itself doesn’t implement per-domain ownership; it’s membership-based through `.project`.
- Visibility scoping for reads is implemented separately in per-domain selectors:
  - `apps/projects/selectors.py::visible_projects_queryset`
  - `apps/piles/selectors.py::visible_piles_queryset`
  - `apps/execution/selectors.py`, `apps/evidence/selectors.py`, `apps/audit/selectors.py`, `apps/certification/selectors.py`, `apps/verification/selectors.py`

This selector scoping is required to prevent cross-project leakage.

---

## Admin Privileges

### Verified Facts
- Superusers: full access (request-level and object-level).
- `admin` group: full access.

---

## Read-Only Behaviors

### Verified Facts
- Any user with group `viewer` can perform safe-method requests only.
- Non-admin write operations require `admin` or `engineer` groups.

---

## Sensitive Operations

### Verified Facts
- Sensitive operations are any non-safe HTTP methods (POST/PUT/PATCH/DELETE), which require:
  - user to be in `{admin, engineer}` group (unless superuser)
  - and object-level membership role must also be in write groups when an object ties back to a project.

---

## Workflow-Specific Permissions

### Verified Facts
- Workflow endpoints exist as actions (e.g., pile recalculation, execution submit/revise, verification run/flag transitions, approvals actions, certification actions).
- These endpoints inherit the same default permission behavior unless overridden.

---

## Permission Matrix

### Verified Facts (group-based)
- **superuser**: all methods / all objects
- **admin group**: safe methods + write methods; object-level always allowed
- **engineer group**:
  - safe methods: allowed
  - write methods: allowed only for objects where project membership exists and role permits writes
- **viewer group**:
  - safe methods: allowed (via permission + membership role checks)
  - write methods: denied

---

## Recommendations (no extra invented behavior)

### Recommendations (derived strictly from existing pattern)
- When adding new endpoints that access project-owned objects, ensure the objects expose `.project` (or that equivalent object-level permission resolution holds).
- For new read endpoints, add selector scoping rather than relying solely on permission checks.

