# AI prompt (YusBuild): Implement a new service function

## Inputs
- domain/app name
- service name and signature intent
- what workflow/persistence steps are required
- whether the action must record audit/timeline events

## Required output
1. Exact function/module placement inside the domain:
   - `apps/<domain>/services.py` OR `apps/<domain>/services/<submodule>.py` based on what exists in the domain
2. Responsibilities:
   - what the service does (validation beyond input normalization is allowed only as needed)
   - what the service returns (serializer-ready structure)
3. Invariants:
   - ensure append-only/auditability rules are respected
4. Selector integration:
   - confirm no visibility scoping is added here (must be in selectors)
5. View integration:
   - specify how the view/action should call this service
6. Tests:
   - list the tests needed to prove workflow transition + side effects
   - include audit/timeline event existence assertions where applicable

## Constraints
- Do not add HTTP response formatting in services.
- Do not add visibility scoping in services.
- Preserve repository patterns for immutable/versioned workflows.

