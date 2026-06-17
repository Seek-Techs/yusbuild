# ID
ADR-013

# Title
Schema endpoint supports YAML and JSON via content negotiation

# Status
Accepted

# Context
Clients integrate using different schema formats.

# Decision
Expose schema at `/api/schema/` with drf-spectacular supporting `format=json|yaml`.

# Consequences
- Advantages:
  - Better tooling compatibility
- Trade-offs:
  - Slightly more configuration complexity

Evidence:
- `tests/test_openapi_schema.py` uses drf-spectacular management command; schema endpoint includes `format` query parameter in schema.
- `config/urls.py` exposes schema view.

