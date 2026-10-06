from rest_framework.routers import DefaultRouter
from .views import PlantViewSet, CareHistoryViewSet

router = DefaultRouter()
router.register('plants', PlantViewSet, basename='plant')
router.register('care-history', CareHistoryViewSet, basename='carehistory')

urlpatterns = router.urls
