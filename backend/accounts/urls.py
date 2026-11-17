from django.urls import path
from .views import (
    AdminOverviewView, CSRFView, LoginView, LogoutView, RegisterView, WhoAmIView,
)

urlpatterns = [
    path('csrf/', CSRFView.as_view()),
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('whoami/', WhoAmIView.as_view()),
    path('admin-overview/', AdminOverviewView.as_view()),
]
