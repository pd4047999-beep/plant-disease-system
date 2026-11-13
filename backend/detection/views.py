from PIL import Image
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .predictor import predict

ALLOWED_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
MAX_SIZE = 5 * 1024 * 1024  # 5 MB


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

        # content_type comes from the browser and can be faked, so also check
        # that Pillow can really open the file as an image.
        try:
            Image.open(image).verify()
        except Exception:
            return Response({"error": "That file is not a valid image."}, status=400)
        image.seek(0)

        try:
            result = predict(image)
        except FileNotFoundError:
            return Response({"error": "The detection model file is missing on the server."}, status=500)
        except Exception:
            return Response({"error": "The model could not analyze this image."}, status=500)

        return Response(result)
