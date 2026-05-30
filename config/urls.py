"""
URL configuration for yusbuild project.
"""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from apps.common.views import health_check, readiness_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health_check"),
    path("readiness/", readiness_check, name="readiness_check"),
    path("api/v1/projects/", include("apps.projects.urls")),
    path("api/v1/piles/", include("apps.piles.urls")),
    path("api/v1/execution/", include("apps.execution.urls")),
    path("api/v1/approvals/", include("apps.approvals.urls")),
    path("api/v1/evidence/", include("apps.evidence.urls")),
    path("api/v1/verification/", include("apps.verification.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
