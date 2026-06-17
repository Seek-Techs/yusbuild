# ID
ADR-007

# Title
DRF routers with custom @action endpoints and minimal HTTP glue

# Status
Accepted

# Context
The API exposes both CRUD and workflow actions (submit/revise/verify/approve/recalculate/etc.).

# Decision
Use DRF `ViewSet` + router registrations for CRUD and `@action` for workflow endpoints, while keeping views as thin orchestration glue calling services.

# Consequences
- Advantages:
  - Uniform endpoint structure
  - Clear grouping in OpenAPI schema
- Trade-offs:
  - Requires discipline to avoid business logic creep into views

Evidence:
- `apps/piles/views.py` uses actions `bulk-create`, `import-csv`, `recalculate`, `breakdown`, and exports.
- `apps/evidence/views.py` uses `upload`, `verify`, `link` actions.
- `apps/verification/views.py` uses `@action` transitions.

