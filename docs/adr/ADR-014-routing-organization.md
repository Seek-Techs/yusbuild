# ID
ADR-014

# Title
URL routing under /api/v1 via domain routers and config includes

# Status
Accepted

# Context
Endpoints must be organized consistently and discovered via schema.

# Decision
Use DRF routers per domain and include them in `config/urls.py` under `/api/v1/<domain>/`.

# Consequences
- Advantages:
  - Consistent URL discoverability
  - Easier schema grouping in drf-spectacular tags
- Trade-offs:
  - Contributors need to follow router patterns when adding endpoints

Evidence:
- `config/urls.py` includes `apps.projects.urls`, `apps.piles.urls`, etc.
- Each app’s `urls.py` uses `DefaultRouter()`.

