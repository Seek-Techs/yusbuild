# Architecture (repo-verified)

## Overview
YusBuild is a Django + Django REST Framework (DRF) service exposing a JWT-authenticated REST API. Routing is defined in `config/urls.py` and per-domain routers are registered from each `apps/*/urls.py`.

Operational endpoints and schema endpoints are also registered from `config/urls.py` using **drf-spectacular**.

## API framework & schema generation
- DRF configuration sets `DEFAULT_SCHEMA_CLASS = drf_spectacular.openapi.AutoSchema` in `config/settings.py`.
- Schema endpoints exposed by `config/urls.py`:
  - `GET /api/schema/` (SpectacularAPIView) with content negotiation for YAML/JSON.
  - `GET /api/docs/` (SpectacularSwaggerView)
  - `GET /api/redoc/` (SpectacularRedocView)
- drf-spectacular schema generation is validated by `tests/test_openapi_schema.py` (asserts representative paths exist).

## Authentication & authorization model
### Authentication
- Default authentication class is `rest_framework_simplejwt.authentication.JWTAuthentication` (`config/settings.py`).
- JWT endpoints:
  - `POST /api/auth/token/` (TokenObtainPairView)
  - `POST /api/auth/token/refresh/` (TokenRefreshView)

### Permissions and object scoping
- Default permission class is `apps.common.permissions.IsAdminEngineerOrReadOnly`.
- The permission enforces:
  - authenticated users only (`has_permission` returns False when not authenticated)
  - superusers always allowed
  - safe methods (GET/HEAD/OPTIONS) allowed for `viewer`/`engineer`/`admin` groups
  - write methods allowed for `admin` and `engineer` groups
- `IsAdminEngineerOrReadOnly.has_object_permission()` attempts project membership inference:
  - If the object has a `project` attribute, it checks memberships related to that project.

### Query scoping
Domain selector helpers restrict querysets by project membership:
- `apps/projects/selectors.py`: `visible_projects_queryset()` filters `Project` by `ProjectMembership` unless user is superuser/admin group.
- `apps/piles/selectors.py`, `apps/execution/selectors.py`, `apps/evidence/selectors.py`, `apps/certification/selectors.py`, `apps/audit/selectors.py`, `apps/verification/selectors.py` similarly gate visibility via project membership.

## Domain modules
The API is split into DRF viewsets/APIViews registered under:
- `apps.projects` (`/api/v1/projects/`)
- `apps.piles` (`/api/v1/piles/`)
- `apps.execution` (`/api/v1/execution/`)
- `apps.approvals` (`/api/v1/approvals/`)
- `apps.evidence` (`/api/v1/evidence/`)
- `apps.verification` (`/api/v1/verification/`)
- `apps.certification` (`/api/v1/certification/`)
- `apps.audit` (`/api/v1/audit/`)

Routers are included from `config/urls.py`.

## Operational endpoints
- `GET /health/` returns `{"status":"ok","service":"yusbuild-api","version":"1.0.0"}`.
- `GET /readiness/` checks database connectivity via `SELECT 1` and validates migrations via `python manage.py migrate --check`.

## Engineering constants and calculations
- `config/settings.py` defines calculation-related constants:
  - `YUSBUILD_PI_VALUE = 3.142` (Excel-compatible PI)
  - `YUSBUILD_KG_PER_M_FACTOR = 162.2` (Excel-compatible factor)
- Pile calculation persistence is performed in `apps/piles/services.py` through `calculate_and_persist_pile()`.
  - It computes results using `apps.piles.calculations.PileCalculator.calculate(pile)`.
  - It persists/updates `PileCalculation` and appends `PileCalculationHistory` with snapshots.

## Data immutability (audit trail)
- `apps.audit.models` defines an abstract `AppendOnlyModel` that blocks modification/deletion:
  - `save()` raises `ValidationError` if `self.pk` already exists.
  - `delete()` always raises `ValidationError`.
- `AuditEvent`, `TimelineEvent`, and `DomainEvent` derive from `AppendOnlyModel`.

