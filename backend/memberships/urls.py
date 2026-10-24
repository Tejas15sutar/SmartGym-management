
from rest_framework.routers import DefaultRouter
from .views import MembershipPlanViewSet, MembershipViewSet

router = DefaultRouter()

router.register(
    "plans",
    MembershipPlanViewSet,
    basename="membership-plan"
)

router.register(
    "records",
    MembershipViewSet,
    basename="membership"
)

urlpatterns = router.urls
