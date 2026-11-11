# AI-Powered Plant Disease Detection & Smart Plant Care System

A web app where users upload a leaf photo, get a disease assessment with severity and care
recommendations, and keep a care history for each saved plant.

**Stack:** React (Vite) + Bootstrap, Django + Django REST Framework, SQLite (development).

## Features
- Registration, login, logout (session-based)
- Leaf image upload with validation
- Detection result: species, condition, confidence, severity, recommendation
  (currently a dummy/rule-based service; real model planned)
- My Plants: search, sort, delete
- Care history timeline per plant with editable notes
- Admin panel via Django Admin

## Setup

### Backend
```bash
cd backend
python -m venv ../backend-env
../backend-env/Scripts/activate        # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 (use `localhost`, not `127.0.0.1`, so cookies work).

## Running tests
```bash
cd backend
python manage.py test
```

## Project structure
- `backend/accounts` – registration, login, logout
- `backend/plants` – Plant and CareHistory models and API
- `backend/detection` – image upload and prediction endpoint
- `frontend/src/pages` – React screens
