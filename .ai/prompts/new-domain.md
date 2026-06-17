# AI prompt (YusBuild): Add a new domain app

Use YusBuild repository patterns only. Do not invent new conventions.

## Inputs
- domain name (e.g., `foo`)
- primary entities to manage
- which workflow actions are required (CRUD? submit/approve/verify? etc.)

## Required output
1. Proposed file structure under `apps/<domain>/`:
   - `models.py`
   - `selectors.py`
   - `serializers.py`
   - `views.py`
   - `urls.py`
   - optional `services/`
2. Selector design:
   - which `visible_*_queryset(user)` functions are needed
   - how querysets are scoped by project membership
3. Service design:
   - which workflows/persistence steps belong in services
   - where append-only/audit recording must occur (if the workflow is event-producing)
4. View design:
   - list the endpoints/actions and confirm views remain thin
   - confirm `get_queryset()` uses selectors
5. Permissions/security:
   - confirm the default permission strategy remains intact
   - ensure object-level permission inference can resolve `project` where applicable
6. Tests:
   - list the exact test files and test cases to add/update
   - include an OpenAPI schema validation check if a new endpoint is added

## Constraints
- Business logic goes to `services/`.
- Visibility scoping goes to `selectors.py`.
- Views must not implement workflow logic.
- Preserve append-only/auditability invariants for workflow events.
- Keep code consistent with existing ADRs and `AI_ASSISTANT_GUIDE.md`.

