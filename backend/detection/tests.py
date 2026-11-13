import io

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from PIL import Image
from rest_framework.test import APITestCase

from .disease_info import CLASS_NAMES, describe


def make_image_file():
    buf = io.BytesIO()
    Image.new('RGB', (10, 10), 'green').save(buf, format='JPEG')
    buf.seek(0)
    return SimpleUploadedFile('leaf.jpg', buf.read(), content_type='image/jpeg')


class DiseaseInfoTests(SimpleTestCase):
    def test_there_are_38_unique_classes(self):
        self.assertEqual(len(CLASS_NAMES), 38)
        self.assertEqual(len(set(CLASS_NAMES)), 38)

    def test_every_class_has_valid_info(self):
        for name in CLASS_NAMES:
            info = describe(name)
            self.assertIn(info['severity'], {'healthy', 'mild', 'moderate', 'severe'})
            self.assertTrue(info['recommendation'])
            self.assertTrue(info['species_name'])

    def test_healthy_class_is_marked_healthy(self):
        self.assertEqual(describe('Tomato___healthy')['severity'], 'healthy')


class DetectApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('carol', password='StrongPass123!')

    def test_requires_login(self):
        res = self.client.post('/api/detect/')
        self.assertIn(res.status_code, (401, 403))

    def test_rejects_missing_image(self):
        self.client.force_authenticate(self.user)
        res = self.client.post('/api/detect/', {}, format='multipart')
        self.assertEqual(res.status_code, 400)

    def test_rejects_non_image_file(self):
        self.client.force_authenticate(self.user)
        fake = SimpleUploadedFile('notes.txt', b'hello', content_type='text/plain')
        res = self.client.post('/api/detect/', {'image': fake}, format='multipart')
        self.assertEqual(res.status_code, 400)

    def test_rejects_fake_image_with_image_content_type(self):
        self.client.force_authenticate(self.user)
        fake = SimpleUploadedFile('fake.jpg', b'this is not a jpeg', content_type='image/jpeg')
        res = self.client.post('/api/detect/', {'image': fake}, format='multipart')
        self.assertEqual(res.status_code, 400)

    def test_valid_image_returns_a_well_formed_answer(self):
        # Runs the real model, so this also proves the weights file is in place.
        self.client.force_authenticate(self.user)
        res = self.client.post('/api/detect/', {'image': make_image_file()}, format='multipart')
        self.assertEqual(res.status_code, 200)
        for key in ('class_name', 'confidence_score', 'uncertain', 'alternatives'):
            self.assertIn(key, res.data)
        if not res.data['uncertain']:
            for key in ('species_name', 'detected_condition', 'severity', 'recommendation'):
                self.assertIn(key, res.data)
