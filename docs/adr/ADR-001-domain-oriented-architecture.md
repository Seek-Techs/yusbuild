# ID
ADR-001

# Title
Domain-oriented Django apps (apps/*) with explicit boundaries

# Status
Accepted

# Context
The project spans multiple engineering workflows: projects/piles, execution records, evidence, verification, certification, approvals, and audit timelines.

# Decision
Implement each workflow area as a dedicated Django app under `apps/` and expose the corresponding API via that app’s `views.py` + `urls.py` router.

# Consequences
- Advantages:
  - Clear ownership boundaries for models/logic
  - Easier onboarding for engineers by domain
- Trade-offs:
  - Cross-domain workflow changes require careful coordination
  - Requires consistent patterns (selectors/services) to prevent leakage

Evidence:
- `config/urls.py` includes `apps.*.urls` for `/api/v1/<domain>/`.

