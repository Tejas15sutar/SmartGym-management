
from django.urls import path

from .views import EnquiryListCreateView, EnquiryDetailView

urlpatterns = [
    path("", EnquiryListCreateView.as_view(), name="enquiry-list-create"),
    path("<int:pk>/", EnquiryDetailView.as_view(), name="enquiry-detail"),
]
