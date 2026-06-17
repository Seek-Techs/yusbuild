# YusBuild AI rules: Architecture boundaries

This document is derived from YusBuild repository evidence, especially:
- `docs/adr/*`
- `AI_ASSISTANT_GUIDE.md`
- `ARCHITECTURE.md`, `DEVELOPMENT_GUIDE.md`, `WORKFLOWS.md`, `SECURITY.md`, `PERFORMANCE.md`

## Required boundaries

### 1) Domain separation (apps/*)
- Implement features inside the appropriate Django domain app under `apps/<domain>/`.
- Expose HTTP endpoints through that domain’s `apps/<domain>/urls.py` router.

### 2) Services for business/workflow logic
- Put workflow transitions, persistence orchestration, and snapshot/audit recording into `services/`.
- Keep HTTP logic out of services.

### 3) Selectors for visibility-scoped reads
- Put query scoping (project membership / visibility) into `selectors.py`.
- Views must use selector-returned querysets in `get_queryset()`.

### 4) Thin views
- Views are orchestration glue:
  - bind request inputs
  - select serializers
  - call service functions
  - return response payloads
- Views must not implement visibility rules or business workflow state transitions.

### 5) Auditability and append-only invariants
- Preserve append-only behavior:
  - audit/timeline models enforce immutability (via append-only model invariants)
  - workflow services must continue to record events/timeline where applicable

## What to do when unsure
1. Find the nearest domain pattern in `apps/<domain>/`.
2. Locate existing examples in `views.py` (thin orchestration) + `services/*` (persistence/workflow) + `selectors.py` (visibility-scoped querysets).
3. Ensure audit/timeline recording behavior is preserved for workflow actions.
4. Ensure OpenAPI schema stays valid (see `tests/test_openapi_schema.py`).

