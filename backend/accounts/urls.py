from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter


from .views import (
    AdminDashboardStatsView,
    RegisterView,
    CustomTokenObtainPairView,
    ProfileView,
    MemberListView,
    AdminTestView,
    TrainerTestView,
    MemberTestView,
    ReceptionistTestView,
    AdminUserViewSet
)


admin_router = DefaultRouter()
admin_router.register(
    "admin-users",
    AdminUserViewSet,
    basename="admin-user"
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("users/", MemberListView.as_view(), name="member_list"),

    path("admin-test/", AdminTestView.as_view(), name="admin_test"),
    path("trainer-test/", TrainerTestView.as_view(), name="trainer_test"),
    path("member-test/", MemberTestView.as_view(), name="member_test"),
    path(
        "receptionist-test/",
        ReceptionistTestView.as_view(),
        name="receptionist_test"
    ),
    path(
    "admin-dashboard/stats/",
    AdminDashboardStatsView.as_view(),
    name="admin_dashboard_stats",
    ),
]

urlpatterns += admin_router.urls