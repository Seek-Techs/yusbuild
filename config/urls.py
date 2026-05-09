"""
URL configuration for yusbuild project.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    """Health check endpoint for monitoring."""
    return JsonResponse(
        {"status": "ok", "service": "yusbuild-api", "version": "1.0.0"}
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health_check"),
    path("api/v1/projects/", include("apps.projects.urls")),
    path("api/v1/piles/", include("apps.piles.urls")),
]
