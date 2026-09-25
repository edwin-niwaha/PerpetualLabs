from django.urls import path

from .views import testimonials_list

urlpatterns = [
    path("list/", testimonials_list, name="testimonies-list"),
]
