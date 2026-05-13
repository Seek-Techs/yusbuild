"""
Operational health endpoints.
"""

from django.core.management import call_command
from django.db import connection
from django.http import JsonResponse


def health_check(request):
    """Lightweight liveness check for load balancers."""
    return JsonResponse({"status": "ok", "service": "yusbuild-api", "version": "1.0.0"})


def readiness_check(request):
    """Readiness check that verifies database and migration state."""
    checks = {
        "database": "unknown",
        "migrations": "unknown",
    }
    status_code = 200

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "error"
        status_code = 503

    try:
        call_command("migrate", "--check", verbosity=0)
        checks["migrations"] = "ok"
    except Exception:
        checks["migrations"] = "error"
        status_code = 503

    status = "ready" if status_code == 200 else "not_ready"
    return JsonResponse(
        {
            "status": status,
            "service": "yusbuild-api",
            "checks": checks,
        },
        status=status_code,
    )
