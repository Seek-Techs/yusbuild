from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.execution.views import PileDrivingRecordViewSet

router = DefaultRouter()
router.register(r"driving-records", PileDrivingRecordViewSet, basename="driving-record")

urlpatterns = [
    path("", include(router.urls)),
]
