# TODO_DOCS.md

- [ ] Collect repo-verified facts for documentation sources:
  - [x] Read `README.md`, `API_GUIDE.md`, existing `docs/*.md`
  - [x] Read routing (`config/urls.py`, `apps/*/urls.py`)
  - [x] Read drf-spectacular schema (`schema.yaml`, `schema.yml`) and confirm endpoint existence via `tests/test_openapi_schema.py`
  - [x] Read auth/permissions + visibility selectors (`apps/common/permissions.py`, `apps/*/selectors.py`)
  - [x] Read key views/serializers models for request/response behaviors
  - [x] Read operational endpoints + readiness/health (`apps/common/views.py`)
  - [x] Read deployment artifacts (`Dockerfile`, `docker-compose.yml`, CI workflow)

- [ ] Draft updated documentation set (README.md, ARCHITECTURE.md, ROADMAP.md, DOMAINS.md, API_GUIDE.md, TESTING.md, DEPLOYMENT.md)
- [ ] Ensure each doc statement is sourced from: drf-spectacular schema + existing docs + verified code facts
- [ ] Run a quick sanity check by executing `pytest` (if feasible) and `tests/test_openapi_schema.py`

