from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.certification.views import CertificationPackageViewSet

router = DefaultRouter()
router.register(
    r"packages", CertificationPackageViewSet, basename="certification-package"
)

urlpatterns = [
    path("", include(router.urls)),
]
