# CI/CD — YusBuild (repository-visible behavior)

This document reverse-engineers CI/CD from repository evidence.

---

## Pipeline Philosophy

### Verified Facts
- CI is implemented using GitHub Actions in `.github/workflows/ci.yml`.
- The pipeline is split into two jobs:
  1. `test-lint-migrate`
  2. `docker-build`

---

## Test Pipeline

### Verified Facts: Job `test-lint-migrate`
Runs on: `ubuntu-latest`.

#### Services
- A PostgreSQL 16 container is started via `services.postgres`.
  - healthcheck uses `pg_isready -U yusbuild`.

#### Environment
- `DJANGO_SETTINGS_MODULE=config.test_settings`
- `DATABASE_URL=postgres://yusbuild:yusbuild@127.0.0.1:5432/yusbuild`

#### Steps (verified)
1. Checkout source.
2. Set up Python 3.12.
3. Install system dependencies:
   - `libpq-dev`
   - `postgresql-client`
4. Install Python dependencies:
   - upgrade pip
   - install `ruff==0.15.12`
   - install `requirements.txt`
5. Ruff cache clear: `python -m ruff clean`.
6. Lint: `python -m ruff check .`.
7. Format check: `python -m ruff format --check .`.
8. Wait for Postgres readiness with `pg_isready` loop.
9. Test DB connection with `psql ... SELECT 1;`.
10. Run migrations: `python manage.py migrate --noinput`.
11. Migration consistency check: `python manage.py makemigrations --check --dry-run`.
12. Run tests with coverage: `pytest`.
13. Upload `htmlcov` as artifact `htmlcov`.

---

## Coverage Requirements

### Verified Facts
- Coverage threshold is configured in `pytest.ini`:
  - `--cov-fail-under=85`
- `pytest.ini` also configures:
  - `--cov=apps`
  - `--cov-report=term-missing`
  - `--cov-report=html:htmlcov`

---

## Schema Validation

### Verified Facts
- Schema generation is validated by a test:
  - `tests/test_openapi_schema.py::test_openapi_schema_generation_is_clean`
- This is executed as part of `pytest`.

---

## Build Process

### Verified Facts
- Lint and formatting occur before migrations/tests.
- Migrations are applied prior to tests.
- Missing migrations fail CI via `makemigrations --check --dry-run`.

---

## Containerization

### Verified Facts: Job `docker-build`
- Runs after `test-lint-migrate` (`needs: test-lint-migrate`).
- Builds Docker image:
  - `docker build -t yusbuild:ci .`

### Verified Facts: `Dockerfile`
- Base image: `python:3.12-slim`.
- Installs dependencies from `requirements.txt`.
- Collects static assets (`manage.py collectstatic`).
- Runs gunicorn with `config.wsgi:application`.

---

## Deployment Assumptions

### Verified Facts
- Runtime uses gunicorn in container.
- docker-compose defines a production-like startup command that includes:
  - `python manage.py migrate --noinput`
  - `python manage.py seed_pile_types`
  - gunicorn

---

## Release Strategy

### Verified Facts
- No explicit release/tagging strategy is visible in this workflow file.
- CI triggers on:
  - pushes to `main`, `develop`, and `feature/execution-records`
  - pull requests targeting the same branches.

---

## Failure Handling

### Verified Facts
- Lint errors stop the pipeline (`ruff check` / `ruff format --check`).
- Migration errors stop the pipeline:
  - `migrate` must succeed
  - `makemigrations --check --dry-run` must be clean
- Tests stop the pipeline if any test fails.
- Coverage below 85% fails due to `--cov-fail-under=85`.

---

## Local Reproduction of CI

### Verified Facts (commands)
- Ruff:
  - `python -m ruff check .`
  - `python -m ruff format --check .`
- Tests:
  - `pytest`
- Migration checks:
  - `python manage.py migrate --noinput`
  - `python manage.py makemigrations --check --dry-run`

---

## Recommendations

### Recommendations (non-binding)
- Keep new code covered by tests so that overall coverage remains ≥ 85%.
- Ensure serializers/services changes don’t break schema generation tests.
- If you add migrations, include them so `makemigrations --check --dry-run` remains clean.

