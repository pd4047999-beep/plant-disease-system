from datetime import timedelta

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from detection.disease_info import DISEASES
from plants.models import CareHistory, Plant

from .serializers import RegisterSerializer


def user_payload(user):
    return {"id": user.id, "username": user.username, "is_staff": user.is_staff}


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFView(APIView):
    """Visiting this sets a CSRF cookie in the browser, required before POSTing anywhere."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"detail": "CSRF cookie set"})


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # The login box accepts either a username or an email address.
        identifier = (request.data.get('username') or '').strip()
        password = request.data.get('password') or ''

        if '@' in identifier:
            match = User.objects.filter(email__iexact=identifier).first()
            if match:
                identifier = match.get_username()

        user = authenticate(request, username=identifier, password=password)
        if user is not None:
            login(request, user)
            return Response(user_payload(user))
        return Response({"error": "Invalid email/username or password."}, status=400)


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
            return Response(user_payload(request.user))
        return Response({"id": None, "username": None, "is_staff": False})


class AdminOverviewView(APIView):
    """Numbers and the recent scan log for the custom admin dashboard (staff only)."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        week_ago = timezone.now() - timedelta(days=7)
        recent = CareHistory.objects.select_related('plant__owner')[:25]

        return Response({
            "stats": {
                "total_users": User.objects.count(),
                "new_users_week": User.objects.filter(date_joined__gte=week_ago).count(),
                "total_scans": CareHistory.objects.count(),
                "new_scans_week": CareHistory.objects.filter(created_at__gte=week_ago).count(),
                "plants_tracked": Plant.objects.count(),
                "new_plants_week": Plant.objects.filter(created_at__gte=week_ago).count(),
                "diseases_indexed": len(DISEASES),
            },
            "recent_scans": [
                {
                    "id": scan.id,
                    "user": scan.plant.owner.username,
                    "plant_type": scan.plant.species_name,
                    "diagnosis": scan.detected_condition,
                    "confidence_score": scan.confidence_score,
                    "severity": scan.severity,
                    "created_at": scan.created_at,
                }
                for scan in recent
            ],
        })
