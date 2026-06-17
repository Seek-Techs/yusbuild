# AI prompt (YusBuild): Add a new API endpoint/action

## Inputs
- endpoint path and HTTP method
- domain app
- whether it is CRUD or a workflow action (@action)
- request/response expectations (fields)

## Required output
1. ADR-aligned implementation plan:
   - selectors needed for any scoped reads
   - serializers needed for validation/shape
   - services needed for persistence/workflow
   - views must remain thin orchestration
2. Routing plan:
   - where to register the endpoint in `apps/<domain>/urls.py`
   - ensure it will appear under `/api/v1/<domain>/`
3. Security plan:
   - default permission class compatibility
   - ensure selector scoping prevents cross-project leakage
4. Auditability plan (if workflow action):
   - identify which audit/timeline event(s) must be recorded
   - preserve append-only invariants
5. Tests plan:
   - add/update workflow/API tests
   - ensure schema generation remains clean (schema tests)

## Constraints
- Do not implement business logic in views.
- Do not implement visibility scoping in views.
- Ensure tests are added so coverage remains >= 85%.

