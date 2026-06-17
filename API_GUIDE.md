# API Guide (repo-verified)

## Base URL
- All versioned endpoints are under: **`/api/v1/`** (registered in `config/urls.py`).

## Authentication (JWT)
Default authentication is `rest_framework_simplejwt.authentication.JWTAuthentication`.

JWT endpoints:
- `POST /api/auth/token/` — obtain token pair.
- `POST /api/auth/token/refresh/` — refresh access token.

## Permission model
Default DRF permission is `apps.common.permissions.IsAdminEngineerOrReadOnly`.

Behavior:
- Unauthenticated users: denied.
- Superusers: full access.
- Groups:
  - `viewer`: allowed for safe methods (GET/HEAD/OPTIONS)
  - `engineer`, `admin`: allowed for safe and write methods
- Object-level permission attempts to infer a `project` from the object.

## OpenAPI / Schema
drf-spectacular is used to generate the API schema.

Schema endpoints:
- `GET /api/schema/`
  - Supports content negotiation for YAML and JSON.
- Interactive docs:
  - `GET /api/docs/` (Swagger UI)
  - `GET /api/redoc/` (Redoc)

Schema generation is validated by `tests/test_openapi_schema.py` (asserts key endpoint paths exist).

## Pagination & filtering defaults
DRF settings enable:
- `rest_framework.pagination.PageNumberPagination` with `PAGE_SIZE = 50`.
- Filtering backends include `django_filters.rest_framework.DjangoFilterBackend`, and `SearchFilter`/`OrderingFilter`.

Domain viewsets define `filterset_fields`, `search_fields`, and `ordering_fields`.

## Endpoint families (high-level)
The following endpoint families are registered under `/api/v1/` (via `config/urls.py`):
- `/projects/`
- `/piles/`
- `/execution/`
- `/approvals/`
- `/evidence/`
- `/verification/`
- `/certification/`
- `/audit/`

Custom actions exposed via DRF routers are visible in the schema (`schema.yaml` / `schema.yml`).

## Health & readiness
- `GET /health/`
  - Returns JSON with `status`, `service`, and `version`.
- `GET /readiness/`
  - Checks database (`SELECT 1`).
  - Checks migrations using `migrate --check`.

