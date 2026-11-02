from django.contrib import admin
from .models import Plant, CareHistory


@admin.register(Plant)
class PlantAdmin(admin.ModelAdmin):
    list_display = ('id', 'species_name', 'nickname', 'owner', 'created_at')
    search_fields = ('species_name', 'nickname', 'owner__username')
    list_filter = ('species_name',)


@admin.register(CareHistory)
class CareHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'plant', 'detected_condition', 'severity', 'confidence_score', 'created_at')
    list_filter = ('severity',)
    search_fields = ('detected_condition', 'plant__species_name')
