
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet

router = DefaultRouter()

router.register(
    "records",
    PaymentViewSet,
    basename="payment"
)

urlpatterns = router.urls
