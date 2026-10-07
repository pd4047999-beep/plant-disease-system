from django.urls import path
from .views import DetectView

urlpatterns = [
    path('detect/', DetectView.as_view()),
]
