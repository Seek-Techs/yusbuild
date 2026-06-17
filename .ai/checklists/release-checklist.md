# YusBuild release checklist (AI)

Derived from repo expectations and operational docs.

## CI/quality gates
- [ ] Ruff passes (lint/format).
- [ ] Migrations checks pass.
- [ ] Pytest passes.
- [ ] Coverage >= 85%.

## API compatibility
- [ ] drf-spectacular schema generation passes.
- [ ] Schema endpoints are reachable and include new paths.

## Workflow/audit integrity
- [ ] Workflow actions still record audit/timeline entries.
- [ ] Append-only invariants remain enforced.

## Performance sanity
- [ ] No accidental removal of pagination/scoping.
- [ ] No new N+1 query patterns introduced.

