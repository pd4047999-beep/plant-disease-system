# Mentor Guide: Sprint 2 — Database Models & REST API

By the end of this guide you'll have a working API where you can create, view, update, and delete Plants and their Care History entries — testable directly in your browser, no frontend needed yet.

**Before you start**: open a terminal in VS Code, `cd backend`, and activate your virtual environment (`backend-env\Scripts\activate` on Windows). Every command below assumes you're inside `backend/` with the venv active.

---

## PART A — Plan the data (read before coding)

We're building two models inside your `plants` app:

**`Plant`** — one row per plant a user saves:
- `owner` — which user this plant belongs to
- `species_name` — e.g. "Tomato"
- `nickname` — optional, user-given name, e.g. "Balcony Tomato"
- `created_at` — when it was added

**`CareHistory`** — one row per scan/check-up of a specific plant (this is what powers the timeline on the Plant Detail screen):
- `plant` — which Plant this entry belongs to (a Plant can have many CareHistory entries — this is called a "foreign key" relationship)
- `image` — the uploaded leaf photo
- `detected_condition` — e.g. "Early Blight"
- `confidence_score` — e.g. 87.5 (percent)
- `severity` — one of Healthy / Mild / Moderate / Severe
- `recommendation` — text advice
- `note` — optional user-written note
- `created_at` — when this scan happened

For now, **authentication uses Django's built-in User model** (the one you already created a superuser for in Sprint 1). We're not building custom registration/login yet — that's Sprint 4. For this sprint, you'll log in through Django's admin-style login to test the API.

---

## PART B — Write the models

Open `backend/plants/models.py` in VS Code. Replace its contents with:

```python
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
```

**What this means in plain English:**
- `ForeignKey` creates the "belongs to" relationship — every `CareHistory` row points at exactly one `Plant`, and every `Plant` points at exactly one `User`.
- `on_delete=models.CASCADE` means: if a Plant is deleted, all its CareHistory entries are automatically deleted too (and if a User is deleted, all their Plants go too).
- `related_name='plants'` lets you later write `some_user.plants.all()` to get all plants owned by that user — you'll use this a lot.
- `choices=SEVERITY_CHOICES` restricts the `severity` field to only those four values — Django will reject anything else.
- `ordering = ['-created_at']` means whenever you query CareHistory, it comes back newest-first automatically — exactly what the timeline screen needs.

---

## PART C — Create and run migrations

A "migration" is Django's way of translating your Python model code into actual database tables. Every time you change `models.py`, you repeat this two-step process:

```bash
python manage.py makemigrations plants
python manage.py migrate
```

- `makemigrations` looks at what changed in your models and writes a migration file describing it (check `plants/migrations/` — you'll see a new file like `0001_initial.py`).
- `migrate` actually applies that change to the database (your `db.sqlite3` file).

If you see no errors, your tables now exist.

---

## PART D — Register models in Django Admin

This gives you a free, ready-made web interface to view and edit your data — extremely useful for testing before the frontend exists.

Open `backend/plants/admin.py` and replace its contents with:

```python
from django.contrib import admin
from .models import Plant, CareHistory


@admin.register(Plant)
class PlantAdmin(admin.ModelAdmin):
    list_display = ('id', 'species_name', 'nickname', 'owner', 'created_at')


@admin.register(CareHistory)
class CareHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'plant', 'detected_condition', 'severity', 'confidence_score', 'created_at')
```

Now run the server and check it out:

```bash
python manage.py runserver
```

Go to `http://127.0.0.1:8000/admin/`, log in with the superuser credentials you created in Sprint 1, and you should see **Plants** and **Care historys** (Django's auto-pluralization is a bit clumsy with irregular words — ignore it, it's cosmetic).

Try manually adding one Plant and one CareHistory entry through this admin UI right now, so you have test data to see once the API is built.

---

## PART E — Install Pillow (if not already) and configure media handling

You already installed `pillow` in Sprint 1 (required for `ImageField`). Double check your `backend/config/settings.py` still has, near the bottom:

```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

Now open `backend/config/urls.py` and make sure uploaded images are actually servable during development. Replace its contents with:

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('plants.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

(The `plants.urls` include will error right now because that file doesn't exist yet — that's expected, we create it in Part G below.)

---

## PART F — Write serializers (translate models ↔ JSON)

A serializer converts your Python model objects into JSON (for API responses) and validates incoming JSON back into model data (for API requests). Create a new file: `backend/plants/serializers.py`:

```python
from rest_framework import serializers
from .models import Plant, CareHistory


class CareHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CareHistory
        fields = [
            'id', 'plant', 'image', 'detected_condition',
            'confidence_score', 'severity', 'recommendation',
            'note', 'created_at',
        ]
        read_only_fields = ['created_at']


class PlantSerializer(serializers.ModelSerializer):
    history = CareHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Plant
        fields = [
            'id', 'owner', 'species_name', 'nickname',
            'created_at', 'history',
        ]
        read_only_fields = ['owner', 'created_at']
```

**What this means:** `PlantSerializer` nests the related `CareHistory` entries (via the `history` related_name from Part B) directly inside each Plant's JSON — so when your frontend later fetches a plant, it gets the plant AND its full timeline in one request. `owner` is `read_only` because we'll set it automatically from the logged-in user, not let the client specify it.

---

## PART G — Write viewsets and wire up URLs

A "viewset" bundles the standard list/create/retrieve/update/delete logic into one class, so you don't write repetitive code.

Open `backend/plants/views.py` and replace its contents with:

```python
from rest_framework import viewsets, permissions
from .models import Plant, CareHistory
from .serializers import PlantSerializer, CareHistorySerializer


class PlantViewSet(viewsets.ModelViewSet):
    serializer_class = PlantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return plants belonging to the logged-in user
        return Plant.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CareHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = CareHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return history for plants the logged-in user owns
        return CareHistory.objects.filter(plant__owner=self.request.user)
```

Now create `backend/plants/urls.py`:

```python
from rest_framework.routers import DefaultRouter
from .views import PlantViewSet, CareHistoryViewSet

router = DefaultRouter()
router.register('plants', PlantViewSet, basename='plant')
router.register('care-history', CareHistoryViewSet, basename='carehistory')

urlpatterns = router.urls
```

`DefaultRouter` automatically creates all the standard endpoints for you:
- `GET /api/plants/` — list your plants
- `POST /api/plants/` — create a plant
- `GET /api/plants/1/` — view plant with id 1
- `PUT/PATCH /api/plants/1/` — update it
- `DELETE /api/plants/1/` — delete it
- Same pattern for `/api/care-history/`

---

## PART H — Add Session Authentication for browser testing

So you can log in and test via your browser, open `backend/config/settings.py` and add this near the bottom (if not already there from Sprint 1):

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

Also add the DRF browsable API's login/logout URLs. In `backend/config/urls.py`, update `urlpatterns` to include:

```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('plants.urls')),
    path('api-auth/', include('rest_framework.urls')),  # add this line
]
```

---

## PART I — Test it end-to-end

1. Run the server: `python manage.py runserver`
2. Go to `http://127.0.0.1:8000/api/plants/` in your browser.
3. You'll see Django REST Framework's built-in "browsable API" — a basic but functional web UI for testing.
4. Click **Log in** (top right) and log in with your superuser credentials.
5. Refresh — you should now see the Plant you manually created in Part D (if it belongs to your superuser) listed as JSON.
6. Scroll down — there's an HTML form at the bottom of the page letting you POST a new Plant directly from the browser. Try creating one: fill in `species_name`, leave `nickname` blank or fill it, click **POST**.
7. Visit `http://127.0.0.1:8000/api/care-history/` the same way, and try creating a CareHistory entry — you'll need to upload an image file via the form, pick a `severity` from the dropdown, and reference the `plant` by its ID number.
8. Go back to `http://127.0.0.1:8000/api/plants/1/` (replace `1` with your plant's actual id) — you should see the nested `history` array containing the CareHistory entry you just created.

If all of that works, your API is fully functional.

---

## Troubleshooting

- **"relation does not exist" / database errors** → you likely skipped `makemigrations` or `migrate` after editing models — rerun both.
- **403 Forbidden on the API page** → you're not logged in; click "Log in" top-right of the browsable API page.
- **Image upload field missing on the form** → make sure `pillow` is installed (`pip install pillow`) and `MEDIA_URL`/`MEDIA_ROOT` are set as in Part E.
- **Plants from other users showing up** → double-check `get_queryset` in `views.py` filters by `self.request.user` as shown in Part G.
- **"plants.urls" import error on startup** → you likely created `plants/urls.py` after already trying to run the server; just rerun `python manage.py runserver` now that the file exists.

---

## Checkpoint — what you now have

- Two working database models (`Plant`, `CareHistory`) with a proper relationship between them
- A Django Admin interface to view/edit data manually
- A fully functional REST API with list/create/retrieve/update/delete for both models
- Per-user data isolation (you only ever see your own plants)
- Image upload support for leaf photos

This completes Sprint 2. Next up (Sprint 3) is building the actual React pages — Dashboard, Upload & Detection, Result — and connecting them to this API with `axios`, plus wiring in the dummy/rule-based prediction logic so the Upload screen returns a real (if fake) diagnosis.

Go through Parts B–I now. Commit your work to Git when done:

```bash
cd ..
git add .
git commit -m "Sprint 2: Plant and CareHistory models, serializers, API endpoints"
git push
```

Come back and tell me how the testing in Part I went — especially whether the nested `history` array showed up correctly in Part I Step 8, since that's the trickiest part to get right.
