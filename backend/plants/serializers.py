from rest_framework import serializers
from .models import Plant, CareHistory

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB


class CareHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CareHistory
        fields = [
            'id', 'plant', 'image', 'detected_condition',
            'confidence_score', 'severity', 'recommendation',
            'note', 'created_at',
        ]
        read_only_fields = ['created_at']

    def validate_plant(self, plant):
        request = self.context.get('request')
        if request and plant.owner != request.user:
            raise serializers.ValidationError("You can only add history to your own plants.")
        return plant

    def validate_confidence_score(self, value):
        if not 0 <= value <= 100:
            raise serializers.ValidationError("Confidence must be between 0 and 100.")
        return value

    def validate_image(self, image):
        if image.size > MAX_IMAGE_BYTES:
            raise serializers.ValidationError("Image must be 5 MB or smaller.")
        return image


class PlantSerializer(serializers.ModelSerializer):
    history = CareHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Plant
        fields = [
            'id', 'owner', 'species_name', 'nickname',
            'created_at', 'history',
        ]
        read_only_fields = ['owner', 'created_at']

    def validate_species_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Species name cannot be blank.")
        return value
