# AI prompt (YusBuild): Add tests for a behavior change

## Inputs
- file(s) or endpoint(s) being changed
- workflow side effects expected (history/audit/timeline)
- schema expectations if new endpoint/action was added

## Required output
1. Test location(s) in `tests/` based on behavior category.
2. Exact test cases to add:
   - success path
   - permission/scoping failures (where applicable)
   - workflow invalid transition -> expected HTTP status (often 409)
3. Side effect assertions:
   - audit/timeline rows created
   - immutable/versioned history rows appended
4. OpenAPI schema:
   - which schema assertions need updating
5. Coverage considerations:
   - which lines/branches will be covered by the tests

## Constraints
- Keep tests aligned with existing patterns in `tests/test_api.py` and workflow tests.
- Avoid inventing new semantics; assert behavior that already exists or is being intentionally changed.

