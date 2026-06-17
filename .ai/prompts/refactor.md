# AI prompt (YusBuild): Refactor with architectural invariants

## Inputs
- what code needs refactoring
- goal (deduplicate queries, split into services/selectors, improve readability)

## Required output
1. List which architectural rule(s) are preserved (from ADRs):
   - service layer pattern
   - selector scoping
   - thin views
   - permissions
   - auditability and append-only invariants
2. Refactor plan that does not change behavior:
   - what moves where (views -> services; reads -> selectors)
   - how to preserve queryset optimization patterns
3. Tests to run and update:
   - API/workflow tests relevant to changed endpoints
   - OpenAPI schema test if endpoints/serializers changed
4. Ensure coverage >= 85%.

## Constraints
- Avoid behavior changes.
- Keep OpenAPI schema generation clean.

