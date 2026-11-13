import io
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APITestCase
from .models import Plant


def make_image_file(name='leaf.jpg'):
    buf = io.BytesIO()
    Image.new('RGB', (10, 10), 'green').save(buf, format='JPEG')
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type='image/jpeg')


class PlantApiTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user('alice', password='StrongPass123!')
        self.bob = User.objects.create_user('bob', password='StrongPass123!')
        self.alice_plant = Plant.objects.create(owner=self.alice, species_name='Tomato')
        self.bob_plant = Plant.objects.create(owner=self.bob, species_name='Mango')

    def test_requires_login(self):
        res = self.client.get('/api/plants/')
        self.assertIn(res.status_code, (401, 403))

    def test_user_sees_only_own_plants(self):
        self.client.force_authenticate(self.alice)
        res = self.client.get('/api/plants/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['species_name'], 'Tomato')

    def test_create_plant_sets_owner_automatically(self):
        self.client.force_authenticate(self.alice)
        res = self.client.post('/api/plants/', {'species_name': 'Guava'})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Plant.objects.get(id=res.data['id']).owner, self.alice)

    def test_blank_species_name_rejected(self):
        self.client.force_authenticate(self.alice)
        res = self.client.post('/api/plants/', {'species_name': '   '})
        self.assertEqual(res.status_code, 400)

    def test_cannot_delete_other_users_plant(self):
        self.client.force_authenticate(self.alice)
        res = self.client.delete(f'/api/plants/{self.bob_plant.id}/')
        self.assertEqual(res.status_code, 404)
        self.assertTrue(Plant.objects.filter(id=self.bob_plant.id).exists())

    def test_cannot_add_history_to_other_users_plant(self):
        self.client.force_authenticate(self.alice)
        res = self.client.post('/api/care-history/', {
            'plant': self.bob_plant.id,
            'image': make_image_file(),
            'detected_condition': 'Leaf Spot',
            'confidence_score': 70,
            'severity': 'mild',
            'recommendation': 'Trim leaves.',
        }, format='multipart')
        self.assertEqual(res.status_code, 400)

    def test_confidence_out_of_range_rejected(self):
        self.client.force_authenticate(self.alice)
        res = self.client.post('/api/care-history/', {
            'plant': self.alice_plant.id,
            'image': make_image_file(),
            'detected_condition': 'Leaf Spot',
            'confidence_score': 250,
            'severity': 'mild',
            'recommendation': 'Trim leaves.',
        }, format='multipart')
        self.assertEqual(res.status_code, 400)
