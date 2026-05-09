"""
URL routing for the Piles app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.piles.views import PileViewSet, PileTypeConfigurationViewSet

router = DefaultRouter()
router.register(r"", PileViewSet, basename="pile")
router.register(r"configs", PileTypeConfigurationViewSet, basename="pile-config")

urlpatterns = [
    path("", include(router.urls)),
]
