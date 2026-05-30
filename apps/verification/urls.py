from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.verification.views import RunVerificationChecksAPIView, VarianceFlagViewSet

router = DefaultRouter()
router.register(r"flags", VarianceFlagViewSet, basename="variance-flag")

urlpatterns = [
    path(
        "run-checks/<int:execution_record_version_id>/",
        RunVerificationChecksAPIView.as_view(),
    ),
    path("", include(router.urls)),
]
