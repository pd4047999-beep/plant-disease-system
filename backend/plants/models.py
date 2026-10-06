from django.db import models
from django.contrib.auth.models import User


class Plant(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plants')
    species_name = models.CharField(max_length=100)
    nickname = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nickname or self.species_name


class CareHistory(models.Model):
    SEVERITY_CHOICES = [
        ('healthy', 'Healthy'),
        ('mild', 'Mild'),
        ('moderate', 'Moderate'),
        ('severe', 'Severe'),
    ]

    plant = models.ForeignKey(Plant, on_delete=models.CASCADE, related_name='history')
    image = models.ImageField(upload_to='leaf_images/')
    detected_condition = models.CharField(max_length=150)
    confidence_score = models.FloatField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    recommendation = models.TextField()
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']  # newest first, matches the timeline screen

    def __str__(self):
        return f"{self.plant} — {self.detected_condition} ({self.created_at.date()})"

