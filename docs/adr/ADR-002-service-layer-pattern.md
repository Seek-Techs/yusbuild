# ID
ADR-002

# Title
Business logic resides in services/*, not in views/serializers

# Status
Accepted

# Context
DRF provides request/response glue (views/serializers), but workflow logic must be deterministic, testable, and consistent.

# Decision
Delegate domain behaviors to service modules. Views call service functions; serializers delegate persistence/calculation to service helpers.

# Consequences
- Advantages:
  - Keeps views thin and focused on HTTP concerns
  - Improves unit testability of business logic
  - Centralizes workflow transitions and persistence
- Trade-offs:
  - More files/modules
  - Requires contributors to learn service boundaries

Evidence:
- Piles: `apps/piles/services.py::calculate_and_persist_pile()` called from `apps/piles/views.py`.
- Evidence: `apps/evidence/services/evidence_service.py` called from `apps/evidence/views.py`.
- Verification transitions: `apps/verification/services/*` called from `apps/verification/views.py`.

