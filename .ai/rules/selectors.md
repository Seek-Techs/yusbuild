# YusBuild AI rules: Selectors layer

Derived from:
- `docs/adr/ADR-003-selector-pattern-for-read-visibility-scoping.md`
- `AI_ASSISTANT_GUIDE.md`
- `PERMISSIONS.md`

## Selector responsibilities
- Provide visibility-scoped querysets based on authenticated user and project membership.
- Return querysets that views can safely paginate/filter/summarize.

## Naming
- Prefer `visible_<entity>_queryset(user)` and similar patterns.

## ORM/query shape requirements
- Selectors may optimize ORM shape via:
  - `select_related`
  - `prefetch_related`
  - `distinct`
  - join-safe queryset construction
- Ensure scoping is applied before returning.

## Guardrails
- Views must not reimplement visibility filtering.
- If a new endpoint needs project-scoped reads, first add/extend selector(s), then call them from the view.

