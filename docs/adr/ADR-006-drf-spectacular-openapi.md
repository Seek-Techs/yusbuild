# ID
ADR-006

# Title
Schema-first API documentation with drf-spectacular

# Status
Accepted

# Context
The project requires reliable, generated API documentation aligned with actual endpoints.

# Decision
Configure `drf_spectacular` and expose schema + documentation views, and enforce schema generation in tests.

# Consequences
- Advantages:
  - Keeps docs consistent with runtime behavior
  - Enables client integration using generated schemas
- Trade-offs:
  - Contributors must ensure schema generation remains clean (no serializer/schema errors)

Evidence:
- `config/settings.py` `DEFAULT_SCHEMA_CLASS` and `SPECTACULAR_SETTINGS`.
- `config/urls.py` exposes `/api/schema/`, `/api/docs/`, `/api/redoc/`.
- `tests/test_openapi_schema.py` asserts key paths exist in generated schema.

