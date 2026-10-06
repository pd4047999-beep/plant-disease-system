from rest_framework import viewsets, permissions
from .models import Plant, CareHistory
from .serializers import PlantSerializer, CareHistorySerializer


class PlantViewSet(viewsets.ModelViewSet):
    serializer_class = PlantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return plants belonging to the logged-in user
        return Plant.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CareHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = CareHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return history for plants the logged-in user owns
        return CareHistory.objects.filter(plant__owner=self.request.user)
