# Testing (repo-verified)

## Test runner & coverage
- `pytest.ini` configures:
  - `DJANGO_SETTINGS_MODULE = config.test_settings`
  - `--cov=apps` and minimum coverage `--cov-fail-under=85`
  - `pytest` runs tests under `tests/`.

## CI workflow
`.github/workflows/ci.yml` runs:
- Ruff lint (`python -m ruff check .`)
- Ruff formatting check (`python -m ruff format --check .`)
- Postgres service (Postgres 16)
- Database migrations (`python manage.py migrate --noinput`)
- Missing migrations check (`python manage.py makemigrations --check --dry-run`)
- Test suite (`pytest`)

## Schema generation test
`tests/test_openapi_schema.py` validates that drf-spectacular schema generation is clean and includes representative endpoint paths.

## Example tests from suite
Some repository-tested API behaviors include:
- Health endpoints:
  - `GET /health/` returns 200 and `status == "ok"` (`tests/test_api.py`).
  - `GET /readiness/` returns 200 (`tests/test_api.py`).
- Piles:
  - `POST /api/v1/piles/import-csv/` supports `dry_run` and returns row-level errors (`tests/test_api.py`).
  - `POST /api/v1/piles/bulk-create/` accepts list payloads and returns `created` and `errors` (`tests/test_api.py`).
  - `GET /api/v1/piles/boq-export-csv/` and `GET /api/v1/piles/boq-export-xlsx/` return valid exports (`tests/test_api.py`).
- Authorization:
  - Viewer cannot PATCH assigned projects (expects 403).
  - Engineer cannot list unassigned projects.
  - Engineer cannot create piles for unassigned projects.
  - Duplicate pile `pile_no` within a project returns 400.
  (`tests/test_api.py`)

## Importer unit tests
`tests/test_import_export_stabilization.py` validates importer behavior:
- Dry-run importer does not persist.
- Importer reports row-level errors for invalid rows.

## How to run locally
The repository README includes Docker-based commands:
- `docker compose exec web pytest`
- `docker compose exec web pytest tests/test_calculations.py -v`
- `docker compose exec web pytest --cov=apps --cov-report=term-missing`

