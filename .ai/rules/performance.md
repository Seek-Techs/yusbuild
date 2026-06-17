# YusBuild AI rules: Performance principles

Derived from:
- `docs/adr/ADR-009-pile-calculation-persistence-with-snapshots.md`
- `PERFORMANCE.md`

## Primary performance strategy (verified)
- Reduce query counts and result sizes via:
  - visibility scoping in selectors
  - pagination
  - ORM shape optimizations (`select_related`, `prefetch_related`)

## ORM optimization guardrails
- If building querysets for list endpoints, follow existing optimization patterns used by views/selectors in the relevant domain.
- Avoid N+1 query patterns:
  - prefer `select_related` for FK joins
  - prefer `prefetch_related` for reverse/m2m relations

## Bulk operations
- For bulk and export endpoints, preserve existing transaction semantics and buffering approach.

## Append-only growth impact
- Many workflows create new immutable rows (versions/history/events).
- Ensure timeline/history endpoints preserve scoping + pagination so the workload remains bounded.

