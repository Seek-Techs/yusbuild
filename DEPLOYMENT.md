# Deployment (repo-verified)

## Container build
`Dockerfile`:
- Base image: `python:3.12-slim`
- Installs system deps for Postgres: `gcc`, `libpq-dev`
- Sets `DJANGO_SETTINGS_MODULE=config.settings`
- Collects static: `python manage.py collectstatic --noinput`
- Runs gunicorn:
  - `gunicorn --bind 0.0.0.0:8000 --workers 2 --timeout 60 --access-logfile - --error-logfile - config.wsgi:application`

Exposed port:
- `EXPOSE 8000`

## Docker Compose
`docker-compose.yml` defines:
- `db` service:
  - image: `postgres:16-alpine`
  - container name: `yusbuild-db`
  - ports: `5432:5432`
  - requires `POSTGRES_USER` and `POSTGRES_PASSWORD`
  - healthcheck uses `pg_isready`
- `web` service:
  - depends_on: `db` with `condition: service_healthy`
  - runs a command that performs:
    - `python manage.py migrate --noinput`
    - `python manage.py seed_pile_types`
    - `gunicorn --bind 0.0.0.0:8000 --workers 4 --timeout 60 ... config.wsgi:application`
  - requires environment variables:
    - `DJANGO_SECRET_KEY`
    - `ALLOWED_HOSTS`
  - sets `DEBUG` from `${DEBUG:-False}`
  - mounts `./logs` to `/app/logs`

## CI deployment build validation
`.github/workflows/ci.yml` includes a job `docker-build` that builds the Docker image:
- `docker build -t yusbuild:ci .`

## Operational endpoints
Deployment docs should include operational endpoints:
- `GET /health/` (liveness)
- `GET /readiness/` (readiness)

These are registered in `config/urls.py` and implemented in `apps/common/views.py`.

