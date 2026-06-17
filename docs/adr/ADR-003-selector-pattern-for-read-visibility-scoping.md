# ID
ADR-003

# Title
Visibility and read-query shaping via selectors.py

# Status
Accepted

# Context
Endpoints must enforce project-level visibility and avoid accidental cross-project data exposure.

# Decision
Use `selectors.py` modules to implement query scoping based on authenticated user and project membership, returning querysets used by views.

# Consequences
- Advantages:
  - Makes visibility rules reusable and auditable
  - Standardizes `get_queryset()` across endpoints
- Trade-offs:
  - Contributors must route new read logic through selectors

Evidence:
- `apps/projects/selectors.py::visible_projects_queryset()`.
- `apps/piles/selectors.py::visible_piles_queryset()`.
- `apps/execution/selectors.py`, `apps/evidence/selectors.py`, `apps/audit/selectors.py`, `apps/certification/selectors.py`, `apps/verification/selectors.py`.

