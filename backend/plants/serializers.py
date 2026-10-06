from rest_framework import serializers
from .models import Plant, CareHistory


class CareHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CareHistory
        fields = [
            'id', 'plant', 'image', 'detected_condition',
            'confidence_score', 'severity', 'recommendation',
            'note', 'created_at',
        ]
        read_only_fields = ['created_at']


class PlantSerializer(serializers.ModelSerializer):
    history = CareHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Plant
        fields = [
            'id', 'owner', 'species_name', 'nickname',
            'created_at', 'history',
        ]
        read_only_fields = ['owner', 'created_at']
