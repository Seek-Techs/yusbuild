from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.evidence.views import EvidenceItemViewSet

router = DefaultRouter()
router.register(r"", EvidenceItemViewSet, basename="evidence")

urlpatterns = [
    path("", include(router.urls)),
]
