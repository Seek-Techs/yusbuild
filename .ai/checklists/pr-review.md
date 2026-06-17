# YusBuild PR review checklist (AI)

Derived from repository standards + `AI_ASSISTANT_GUIDE.md`.

## Architecture
- [ ] Business logic is in `services/` (not in `views.py` or `serializers.py`).
- [ ] Read visibility scoping is in `selectors.py` (views use selector querysets).
- [ ] Views are thin orchestration glue.

## Security
- [ ] Default permission class semantics remain intact.
- [ ] No cross-project leakage: querysets are selector-scoped.
- [ ] For object-level permissions, objects expose the expected `project` relationship.

## Auditability
- [ ] Workflow actions preserve append-only audit/timeline recording.
- [ ] No updates/deletes attempted on append-only audit models.

## Testing & schema
- [ ] Tests added/updated; overall coverage remains >= 85%.
- [ ] OpenAPI schema generation test remains clean (`tests/test_openapi_schema.py`).

## Performance
- [ ] Querysets reuse existing optimization patterns (`select_related`/`prefetch_related`/`distinct`).
- [ ] List endpoints remain paginated/scoped.

## Code quality
- [ ] Ruff lint/format passes.

