# YusBuild AI rules: Security & authorization

Derived from:
- `docs/adr/ADR-004-default-permission-strategy.md`
- `SECURITY.md`
- `apps/common/permissions.py` behavior (as documented in repo guidance)

## Authorization model (verified)
- Default DRF permission: `apps.common.permissions.IsAdminEngineerOrReadOnly`.
- Roles are Django groups: `admin`, `engineer`, `viewer`.

## Defense in depth
- Permission checks decide whether a request can proceed.
- Selectors must still scope the returned rows to the user’s visibility.

## Object-level permissions
- Object-level permission inference may rely on resolving `project` from object attributes.
- For new domain objects, ensure the object provides the expected project relationship so object-level checks work.

## Guardrails for AI-generated code
- Never bypass selectors by constructing unscoped querysets.
- Never assume object-level permission inference works without verifying object structure.

