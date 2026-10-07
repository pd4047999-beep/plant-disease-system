from django.urls import path
from .views import CSRFView, LoginView, LogoutView, WhoAmIView

urlpatterns = [
    path('csrf/', CSRFView.as_view()),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('whoami/', WhoAmIView.as_view()),
]
