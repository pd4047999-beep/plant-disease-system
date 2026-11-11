import random
from PIL import Image
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

ALLOWED_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
MAX_SIZE = 5 * 1024 * 1024  # 5 MB

# Hardcoded fake results — this is the "dummy prediction service."
# In a later sprint, this list gets replaced by a real trained model.
DUMMY_RESULTS = [
    {
        "species_name": "Tomato",
        "detected_condition": "Early Blight",
        "confidence_score": 87.5,
        "severity": "moderate",
        "recommendation": "Remove affected leaves, apply a copper-based fungicide, and avoid overhead watering.",
    },
    {
        "species_name": "Mango",
        "detected_condition": "Healthy",
        "confidence_score": 95.2,
        "severity": "healthy",
        "recommendation": "No action needed. Continue regular watering and ensure adequate sunlight.",
    },
    {
        "species_name": "Jackfruit",
        "detected_condition": "Leaf Spot",
        "confidence_score": 72.3,
        "severity": "mild",
        "recommendation": "Trim affected leaves and improve air circulation around the plant.",
    },
    {
        "species_name": "Guava",
        "detected_condition": "Anthracnose",
        "confidence_score": 64.0,
        "severity": "severe",
        "recommendation": "Isolate the plant if possible, remove all infected material, and apply a recommended fungicide promptly.",
    },
]


class DetectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        image = request.FILES.get('image')
        if not image:
            return Response({"error": "No image provided."}, status=400)
        if image.content_type not in ALLOWED_TYPES:
            return Response({"error": "Only JPG, PNG or WEBP images are allowed."}, status=400)
        if image.size > MAX_SIZE:
            return Response({"error": "Image must be 5 MB or smaller."}, status=400)

        # The content_type above is claimed by the browser and can be faked,
        # so also check that Pillow can really open the file as an image.
        try:
            Image.open(image).verify()
        except Exception:
            return Response({"error": "That file is not a valid image."}, status=400)
        image.seek(0)

        result = random.choice(DUMMY_RESULTS)
        return Response(result)
