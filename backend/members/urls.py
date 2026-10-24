from django.urls import path

from .views import MemberProfileView


urlpatterns = [
    path(
        "profile/",
        MemberProfileView.as_view(),
        name="member_profile"
    ),
]