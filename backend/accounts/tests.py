from django.test import TestCase

# Create your tests here.
import io
import tempfile
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.test import APITestCase

from plants.models import CareHistory, Plant


def make_image_file(name='leaf.jpg'):
    buf = io.BytesIO()
    Image.new('RGB', (10, 10), 'green').save(buf, format='JPEG')
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type='image/jpeg')


class LoginTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('leafy', email='leafy@example.com', password='StrongPass123!')

    def test_login_with_username(self):
        res = self.client.post('/api/auth/login/', {'username': 'leafy', 'password': 'StrongPass123!'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['username'], 'leafy')
        self.assertFalse(res.data['is_staff'])

    def test_login_with_email_any_case(self):
        res = self.client.post('/api/auth/login/', {'username': 'LEAFY@Example.com', 'password': 'StrongPass123!'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['username'], 'leafy')

    def test_wrong_password_rejected(self):
        res = self.client.post('/api/auth/login/', {'username': 'leafy@example.com', 'password': 'nope'})
        self.assertEqual(res.status_code, 400)

    def test_unknown_email_rejected(self):
        res = self.client.post('/api/auth/login/', {'username': 'ghost@example.com', 'password': 'StrongPass123!'})
        self.assertEqual(res.status_code, 400)

    def test_missing_fields_rejected(self):
        res = self.client.post('/api/auth/login/', {})
        self.assertEqual(res.status_code, 400)

    def test_whoami_reports_staff_flag(self):
        res = self.client.get('/api/auth/whoami/')
        self.assertIsNone(res.data['username'])
        self.assertFalse(res.data['is_staff'])
        admin = User.objects.create_user('boss', password='StrongPass123!', is_staff=True)
        self.client.force_authenticate(admin)
        res = self.client.get('/api/auth/whoami/')
        self.assertEqual(res.data['username'], 'boss')
        self.assertTrue(res.data['is_staff'])


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class AdminOverviewTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('leafy', email='leafy@example.com', password='StrongPass123!')
        self.admin = User.objects.create_user('boss', email='boss@example.com', password='StrongPass123!', is_staff=True)
        self.plant = Plant.objects.create(owner=self.user, species_name='Tomato')
        self.scan = CareHistory.objects.create(
            plant=self.plant, image=make_image_file(), detected_condition='Late Blight',
            confidence_score=94.7, severity='severe', recommendation='Act quickly.',
        )

    def test_anonymous_is_refused(self):
        res = self.client.get('/api/auth/admin-overview/')
        self.assertIn(res.status_code, (401, 403))

    def test_normal_user_is_refused(self):
        self.client.force_authenticate(self.user)
        res = self.client.get('/api/auth/admin-overview/')
        self.assertEqual(res.status_code, 403)

    def test_staff_gets_stats_and_recent_scans(self):
        self.client.force_authenticate(self.admin)
        res = self.client.get('/api/auth/admin-overview/')
        self.assertEqual(res.status_code, 200)
        stats = res.data['stats']
        self.assertEqual(stats['total_users'], 2)
        self.assertEqual(stats['total_scans'], 1)
        self.assertEqual(stats['plants_tracked'], 1)
        self.assertEqual(stats['new_scans_week'], 1)
        self.assertEqual(stats['diseases_indexed'], 26)
        row = res.data['recent_scans'][0]
        self.assertEqual(row['user'], 'leafy')
        self.assertEqual(row['plant_type'], 'Tomato')
        self.assertEqual(row['diagnosis'], 'Late Blight')
        self.assertEqual(row['severity'], 'severe')

    def test_old_scans_are_not_counted_as_this_week(self):
        CareHistory.objects.filter(pk=self.scan.pk).update(created_at=timezone.now() - timedelta(days=30))
        self.client.force_authenticate(self.admin)
        stats = self.client.get('/api/auth/admin-overview/').data['stats']
        self.assertEqual(stats['total_scans'], 1)
        self.assertEqual(stats['new_scans_week'], 0)

    def test_log_is_limited_to_25_newest(self):
        for i in range(30):
            CareHistory.objects.create(
                plant=self.plant, image=make_image_file(f'l{i}.jpg'), detected_condition=f'C{i}',
                confidence_score=80, severity='mild', recommendation='x',
            )
        self.client.force_authenticate(self.admin)
        res = self.client.get('/api/auth/admin-overview/')
        self.assertEqual(len(res.data['recent_scans']), 25)
