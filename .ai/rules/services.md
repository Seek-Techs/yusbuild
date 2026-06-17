# YusBuild AI rules: Service layer

Derived from:
- `docs/adr/ADR-002-service-layer-pattern.md`
- `AI_ASSISTANT_GUIDE.md`
- `DEVELOPMENT_GUIDE.md`

## Service responsibilities (verified patterns)
- Orchestrate domain workflow and persistence.
- Create/append immutable history rows (e.g., pile calculation history, execution versions, audit/timeline events).
- Return values suitable for serializer representation.

## Do NOT do in services
- HTTP request/response formatting.
- Implement visibility scoping (that belongs in `selectors.py`).

## Service naming / structure (convention from repo)
- Use verb-named functions and module structure consistent with domain:
  - `apps/piles/services.py::calculate_and_persist_pile`
  - `apps/evidence/services/evidence_service.py::*`
  - `apps/verification/services/*` transitions and rule checks

## Determinism / idempotency
- For verification/run-check workflows, preserve existing idempotency semantics (repo documents deterministic behavior).

## Auditability
- Workflow actions must preserve existing event/timeline recording behavior.
- Never attempt to update/delete append-only audit rows; create new entries instead.

