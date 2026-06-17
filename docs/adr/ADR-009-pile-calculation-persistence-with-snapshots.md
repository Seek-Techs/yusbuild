# ID
ADR-009

# Title
Store calculation outputs plus immutable input/config/constants snapshots

# Status
Accepted

# Context
Engineering quantities must be reproducible even after configurations/constants change.

# Decision
On calculation (create/update/recalculate), persist or update current calculation and append `PileCalculationHistory` with snapshots: inputs/config/constants/result.

# Consequences
- Advantages:
  - Reproducibility and auditability
  - Ability to serve calculation history endpoints
- Trade-offs:
  - More storage and slightly more complex persistence logic

Evidence:
- `apps/piles/services.py::calculate_and_persist_pile()` constructs `build_input_snapshot`, `build_config_snapshot`, `build_constants_snapshot` and writes `PileCalculationHistory`.
- Views expose history via `GET /api/v1/piles/{id}/calculation-history/`.

