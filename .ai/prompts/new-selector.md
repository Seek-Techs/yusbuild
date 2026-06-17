# AI prompt (YusBuild): Add/extend selectors for scoped reads

## Inputs
- domain/app name
- entity name to list/retrieve
- visibility/scoping rules (project membership, role, special filters)

## Required output
1. Selector function(s) to add (prefer `visible_<entity>_queryset(user)`)
2. Query design:
   - which relations must be joined
   - what `select_related`/`prefetch_related`/`distinct` are needed
3. Security proof sketch:
   - explain why the queryset cannot leak rows across projects
4. View integration:
   - specify where `get_queryset()` must call the selector
5. Tests:
   - list which existing API tests should be extended or where to add new tests
   - ensure permissions + selector scoping are validated

## Constraints
- Views must not duplicate scoping logic.
- Selector must apply scoping before returning querysets.
- Avoid query patterns that introduce N+1.

