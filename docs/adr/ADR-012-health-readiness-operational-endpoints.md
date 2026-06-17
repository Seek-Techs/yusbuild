# ID
ADR-012

# Title
Operational endpoints for liveness and readiness

# Status
Accepted

# Context
Deployments require health signals for load balancers and orchestration.

# Decision
Provide `GET /health/` and `GET /readiness/` endpoints; readiness checks both DB connectivity and migration state.

# Consequences
- Advantages:
  - Safer rollout by failing fast when DB/migrations aren’t ready
- Trade-offs:
  - Readiness adds DB/migration checks at request time

Evidence:
- `apps/common/views.py::health_check` and `readiness_check`.
- Routes registered in `config/urls.py`.

