from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFView(APIView):
    """Visiting this sets a CSRF cookie in the browser, required before POSTing anywhere."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"detail": "CSRF cookie set"})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return Response({"id": user.id, "username": user.username})
        return Response({"error": "Invalid username or password."}, status=400)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"detail": "Logged out."})


class WhoAmIView(APIView):
    """React calls this on load to check: is anyone currently logged in?"""
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            return Response({"id": request.user.id, "username": request.user.username})
        return Response({"id": None, "username": None})
