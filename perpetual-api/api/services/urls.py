from django.urls import path

from .views import service_list

urlpatterns = [
    path("list/", service_list, name="service-list"),
]
