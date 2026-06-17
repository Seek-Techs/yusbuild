# Development Guide (YusBuild)

This guide describes **how to work inside this repository** based on existing implementation patterns and architectural decisions.

It explicitly avoids generic Django advice and does not modify existing documentation.

---

## Development Philosophy

### Verified Facts
- The backend is organized by domain apps under `apps/` and each domain registers API routes via DRF routers.
- Authorization uses:
  - DRF default permission: `apps/common/permissions.py::IsAdminEngineerOrReadOnly`
  - Query scoping via selectors: `apps/*/selectors.py` restricts visibility by project membership.
- Business logic is delegated to `services/` modules.
- Views are thin and mostly orchestrate request/response.
- OpenAPI schema is generated with drf-spectacular and validated in tests.
- Audit immutability is enforced by `apps/audit/models.py::AppendOnlyModel`.

### Inferred Practices (from repository structure)
- For any new endpoint, apply the same split:
  - **selectors** for visible row querysets
  - **services** for workflow + persistence
  - **views** as orchestration glue
  - **serializers** for validation + response shapes

---

## Local Setup

### Verified Facts
- The app runs as a Django service; `docker-compose.yml` defines:
  - `db` using `postgres:16-alpine`
  - `web` built from `Dockerfile` and running gunicorn
- Docker container command runs:
  - `python manage.py migrate --noinput`
  - `python manage.py seed_pile_types`
  - gunicorn

### Environment variables (verified)
From `docker-compose.yml` and `config/settings.py`:
- `DJANGO_SECRET_KEY`
- `ALLOWED_HOSTS`
- PostgreSQL settings: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`
- `DEBUG` (default from compose is `${DEBUG:-False}`; settings also parse it)

### Recommendations (no new assumptions)
- Use `docker compose up --build` as the repository README already documents.

---

## Running the application

### Verified Facts
- Docker entrypoint runs migrations and seeds pile type configurations.
- API base routing is under `/api/v1/` and operational endpoints are exposed at:
  - `/health/`
  - `/readiness/`

---

## Running Tests

### Verified Facts
- Pytest configuration:
  - `pytest.ini` sets `DJANGO_SETTINGS_MODULE=config.test_settings`
  - coverage uses `--cov=apps`, `--cov-fail-under=85`
  - test discovery uses `testpaths = tests`

### Commands (verified by repository tests/docs)
- `pytest`
- `docker compose exec web pytest`

### Coverage expectations (verified)
- Minimum coverage threshold enforced: **85%**.

### Test categories (verified by file structure)
- API endpoint behaviors:
  - `tests/test_api.py`
- Workflow domain tests:
  - `tests/test_execution_workflow.py`
  - `tests/test_approval_workflow.py`
  - `tests/test_audit_workflow.py`
  - `tests/test_evidence_workflow.py`
  - `tests/test_verification_workflow.py`
  - `tests/test_certification_workflow.py`
- Schema generation:
  - `tests/test_openapi_schema.py`
- Import/export behaviors:
  - `tests/test_import_export_stabilization.py`

---

## Generating OpenAPI Schema

### Verified Facts
- drf-spectacular is configured in `config/settings.py`.
- Schema endpoints are registered in `config/urls.py`:
  - `GET /api/schema/` supports content negotiation (YAML/JSON)
  - `GET /api/docs/`
  - `GET /api/redoc/`
- Schema generation is tested via `tests/test_openapi_schema.py`.

### How schema.yaml is produced and maintained (verified)
- The repository contains `schema.yaml` / `schema.yml` and validates drf-spectacular generation.
- The test `tests/test_openapi_schema.py` calls the spectacular management command:
  - `call_command('spectacular', file=<output>, stdout=<...>, stderr=<...>)`
  - asserts key endpoint paths are present.

---

## Repository Structure

### Verified Backend layout
- `apps/` contains per-domain modules.
- `config/` contains Django settings and routing.
- `docs/` contains phase/architecture notes.
- Frontend exists under `yusbuild/` (Vite + React) but this guide focuses on backend patterns.

### Domain app pattern (verified)
Within each domain app, follow the established filenames:
- `models.py`
- `selectors.py`
- `serializers.py`
- `views.py`
- `urls.py`
- `services/` (when present)

---

## Creating a New Domain

### Required files and structure
To match existing patterns, create:
- `apps/<domain_name>/models.py`
- `apps/<domain_name>/selectors.py`
- `apps/<domain_name>/serializers.py`
- `apps/<domain_name>/views.py`
- `apps/<domain_name>/urls.py` (router registration)
- `apps/<domain_name>/services/` (if you need workflow/persistence/business logic)

### Naming conventions (verified)
- Use `Visible` / `visible_*_queryset` in selectors where applicable.
- Use DRF viewset naming: `<Entity>ViewSet` for routers.
- Use action URL paths via `@action(..., url_path='...')`.

### Registration steps (verified)
- Register the router in domain `urls.py`.
- Include it under the versioned route in `config/urls.py` (mirrors how existing apps are included).

### Permission/scoping integration
- Ensure new read endpoints use selector scoping.
- Views should use selector querysets in `get_queryset()`.

---

## Models

### Responsibilities (verified)
- Domain entities and constraints belong in `models.py`.
- Immutable/audit behavior belongs in model invariants (e.g., `AppendOnlyModel` prevents update/delete).

### Relationships (verified)
- Authorization scoping assumes models relate to `project` where `has_object_permission` can infer a `project` attribute.

---

## Services

### Business logic rules (verified)
- Business logic belongs in `services/`.
- Views call services.
- Services return values suitable for serialization.

### Examples (verified)
- Pile calculations:
  - `apps/piles/services.py::calculate_and_persist_pile()`
- Evidence workflow:
  - `apps/evidence/services/evidence_service.py`
- Verification checks & transitions:
  - `apps/verification/services/verification_service.py` and `rule_engine.py`
- Certification transitions:
  - `apps/certification/services/certification_service.py` and `package_service.py`

### What does not belong in services
- HTTP response formatting (views handle response)
- Serializer validation beyond normalization/formatting needs

---

## Selectors

### Read responsibilities (verified)
- Selectors define visibility-scoped querysets based on project membership.
- Views use selectors in `get_queryset()`.

### Query patterns (verified)
- Many selectors expose:
  - `visible_<entity>_queryset(user)`
  - `visible_<entity>_ids(user)`
- Selectors return `QuerySet` objects with correct joins:
  - `select_related` / `prefetch_related` / `distinct`

### Examples (verified)
- `apps/projects/selectors.py::visible_projects_queryset`
- `apps/piles/selectors.py::visible_piles_queryset`
- `apps/evidence/selectors.py::visible_evidence_items_queryset`
- `apps/audit/selectors.py::visible_timeline_events_queryset`
- `apps/verification/selectors.py::visible_variance_flags_queryset`

---

## Serializers

### Responsibilities (verified)
- Input validation and normalization (`to_internal_value`, `validate_*`).
- Output shape definitions.

### Limitations (verified by patterns)
- Serializer methods should not implement workflow transitions.
- When persistence/calculation is needed, serialization delegates to service helpers.

### Example (verified)
- `apps/piles/serializers.py::PileCreateUpdateSerializer._run_calculation()` delegates to `calculate_and_persist_pile`.

---

## Views

### Thin-view principles (verified)
Views should:
- bind request data to serializers
- call selectors/services
- return response payloads and HTTP codes

Views should not:
- implement business workflow rules
- implement query scoping logic that belongs in selectors

### Request orchestration (verified)
- Custom actions (`@action`) map 1:1 to workflow endpoints.
- Views handle exceptions mapping to HTTP status codes (e.g., 409 conflicts for invalid workflow transitions).

---

## Permissions

### Authorization handling (verified)
- DRF uses `IsAdminEngineerOrReadOnly` as default permission.
- Permissions use Django groups (`admin`, `engineer`, `viewer`) and `is_superuser`.
- Object-level permission checks infer `project` from object attribute if present.

### Query scoping (verified)
Even with permission checks, selectors apply row-level scoping, preventing accidental leakage.

---

## Routing

### URL registration (verified)
- Each domain app has `apps/<domain>/urls.py` using `DefaultRouter`.
- `config/urls.py` includes each domain router under:
  - `/api/v1/<domain>/`
- Schema endpoints and auth endpoints are registered in `config/urls.py`.

---

## Adding API Endpoints

### Recommended workflow (inferred but supported by repository patterns)
1. Add selector(s) if the endpoint needs visibility scoping.
2. Add serializers for input validation and output shape.
3. Add services for workflow/persistence/business logic.
4. Add view/action wiring and ensure views call services/selectors.
5. Register route under domain `urls.py` router and include in `config/urls.py` if new domain.
6. Add tests:
   - API integration tests in `tests/test_api.py` or domain-specific workflow tests
   - update schema generation remains clean (`tests/test_openapi_schema.py` covers endpoint presence)
7. Verify coverage threshold (85% minimum).

---

## Testing

### Unit tests
- Add tests for core logic where feasible.

### Integration tests
- Prefer API tests that validate request/response and side effects (history/audit snapshots).

### API tests
- Follow existing patterns in `tests/test_api.py` and workflow tests.

### Coverage policy
- Maintain overall coverage above 85%.

---

## Common Anti-Patterns

These are directly warned against by repository structure and existing patterns:

1) Business logic in views
- Delegate to services.

2) Business logic in serializers
- Keep serializers to validation/normalization; delegate real logic to services.

3) Cross-domain leakage
- Avoid querying across domains without applying visibility scoping.

4) Duplicate queries
- Don’t reimplement visibility filtering if a selector exists.

5) Fat models
- Models should enforce invariants, not orchestrate workflows.

6) Generic helper abuse
- Put helpers near the domain: services/selectors.

---

## Pull Request Workflow

### Checklist before merging (verified expectations)
- [ ] Views remain thin (no workflow/business logic)
- [ ] Business logic in services
- [ ] Reads in selectors with visibility scoping
- [ ] Serializers validate and shape
- [ ] Endpoint is represented in schema without breaking drf-spectacular generation
- [ ] Tests added/updated; coverage target maintained (>=85%)
- [ ] Ruff lint/format passes

---

## Verified Facts vs Recommendations

To avoid invented standards:
- **Verified Facts** are based on existing repository code/tests.
- **Recommendations** follow the same patterns already used (thin views + selectors/services separation) and should be treated as “follow current conventions”.

If you keep these boundaries, your contribution will remain consistent with YusBuild’s established architecture.

