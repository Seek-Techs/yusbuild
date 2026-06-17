# AI prompt (YusBuild): Fix a bug without breaking architecture

## Inputs
- symptoms and failing tests (if any)
- likely area (services/selectors/views/serializers/models)

## Required output
1. Root-cause hypothesis tied to repo evidence:
   - service boundary violation?
   - selector scoping regression?
   - permission/object-level inference issue?
   - auditability/immutability invariant break?
2. Minimal code changes plan:
   - keep views thin
   - keep scoping in selectors
   - keep workflow logic in services
3. Update/extend tests to lock the bug fix.
4. Confirm schema generation test passes if an endpoint was affected.

## Constraints
- Do not modify unrelated docs.
- Do not invent new domain logic.
- Preserve append-only/audit invariants.

