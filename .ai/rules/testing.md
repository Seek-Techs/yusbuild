# YusBuild AI rules: Testing expectations

Derived from:
- `docs/adr/ADR-011-test-coverage-policy.md`
- `DEVELOPMENT_GUIDE.md`

## Coverage requirement (verified)
- CI enforces coverage fail-under: **85%**.
- New code must include tests so coverage does not regress.

## What tests should cover
- API endpoint behavior for new actions and state transitions.
- Workflow side effects:
  - history rows
  - audit/timeline event recording
- OpenAPI/schema validity:
  - schema generation must succeed and paths must appear

## Recommended test locations (verified by repo structure)
- `tests/test_api.py` for general API integration checks.
- Workflow-specific tests:
  - `tests/test_execution_workflow.py`
  - `tests/test_approval_workflow.py`
  - `tests/test_audit_workflow.py`
  - `tests/test_evidence_workflow.py`
  - `tests/test_verification_workflow.py`
  - `tests/test_certification_workflow.py`
- `tests/test_openapi_schema.py` for schema generation.

