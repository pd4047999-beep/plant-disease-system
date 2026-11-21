# PlantCare AI: Plant Disease Detection & Smart Plant Care

A web app where users upload a photo of a plant leaf and get an AI diagnosis (crop, disease,
confidence, severity, care recommendation), then save it to a plant and track its care history
over time.

**Stack:** React 19 (Vite) · Django 6 + Django REST Framework · PyTorch (MobileNetV2) · SQLite (development)

## Features
- **Accounts:** registration, login with username *or* email, logout (session-based)
- **Disease detection:** upload a JPG/PNG/WEBP leaf image (max 5 MB); a pretrained
  MobileNetV2 model returns the top 3 predictions with confidence scores
  - Results below 60% confidence are reported as "uncertain" instead of a guess
  - Confident results include species, condition, severity (healthy / mild / moderate / severe)
    and a care recommendation
- **My Plants:** save scans to plants, search, sort and delete plants
- **Care history:** timeline of scans per plant, with editable notes
- **Dashboard:** garden health score and recently monitored plants
- **Admin panel** (staff users only): user / scan / plant statistics and a global
  diagnostic log, with links into Django Admin for full data management

## Model and dataset credits
- Model: [Daksh159/plant-disease-mobilenetv2](https://huggingface.co/Daksh159/plant-disease-mobilenetv2) (pretrained, used for inference only)
- Architecture: MobileNetV2
- Dataset: PlantVillage, 38 classes across 14 crop types
- Weights file: `backend/detection/ml/mobilenetv2_plant.pth`

## Setup

Requirements: Python 3.13+, Node.js 20+.

### Backend
```bash
cd backend
python -m venv backend-env
backend-env\Scripts\activate             # Windows
# source backend-env/bin/activate        # macOS / Linux
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser         # this account can open the Admin Panel
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Use `localhost`, not `127.0.0.1`, so the session cookie works.

The local database (`backend/db.sqlite3`) and uploaded images (`backend/media/`) are created
on your machine and are intentionally not stored in Git.

## Running tests
```bash
cd backend
python manage.py test
```

To check model accuracy against a PlantVillage folder (one sub-folder per class):
```bash
cd backend
python verify_model.py "path/to/plantvillage/color"
```

## Project structure
| Path | Purpose |
|---|---|
| `backend/config` | Django settings and URL routing |
| `backend/accounts` | Registration, login, logout, current user, admin statistics API |
| `backend/plants` | `Plant` and `CareHistory` models and REST API |
| `backend/detection` | Image upload validation, model loading and prediction (`predictor.py`), disease info |
| `frontend/src/pages` | React screens (Login, Register, Dashboard, Upload, Result, My Plants, Plant Detail, Admin Panel) |
| `frontend/src/components` | Shared UI components (Navbar, PlantCard, SeverityPill, …) |
| `frontend/src/api` | Axios client (session cookie + CSRF token) and error helpers |
