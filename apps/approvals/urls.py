from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.approvals.views import ApprovalWorkflowViewSet

router = DefaultRouter()
router.register(r"", ApprovalWorkflowViewSet, basename="approval")

urlpatterns = [
    path("", include(router.urls)),
]
