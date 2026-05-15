"""
URL routing for the Piles app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.piles.views import PileTypeConfigurationViewSet, PileViewSet

router = DefaultRouter()
router.register(r"configs", PileTypeConfigurationViewSet, basename="pile-config")
router.register(r"", PileViewSet, basename="pile")

urlpatterns = [
    path("", include(router.urls)),
    # The BOQ CSV export is handled as an @action on the PileViewSet, so no extra path needed
]
