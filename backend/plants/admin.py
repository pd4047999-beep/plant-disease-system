from django.contrib import admin
from .models import Plant, CareHistory


@admin.register(Plant)
class PlantAdmin(admin.ModelAdmin):
    list_display = ('id', 'species_name', 'nickname', 'owner', 'created_at')


@admin.register(CareHistory)
class CareHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'plant', 'detected_condition', 'severity', 'confidence_score', 'created_at')

