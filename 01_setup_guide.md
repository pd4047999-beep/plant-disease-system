# Mentor Guide: Building the AI-Powered Plant Disease Detection System

This guide takes you from "just VS Code installed" to a running React + Django project, following Sprint 1 of your proposal (repo setup, environment setup for React + Django).

---

## PART A — Understand what you're building (30 seconds)

- **Frontend**: React (talks to the user, shows pages)
- **Backend**: Django + Django REST Framework (handles data, logic, "API")
- **Database**: SQLite for now (a database that's just a file — zero setup)
- **They talk over HTTP**: React runs on `localhost:5173`, Django runs on `localhost:8000`, and React makes API calls to Django.

You will end up with ONE folder like this:

```
plant-care-system/
├── backend/          <- Django project
└── frontend/          <- React project
```

---

## PART B — Install the tools (do this once)

### Step 1: Check what you already have

Open VS Code → open a terminal inside it: menu **Terminal → New Terminal** (or `` Ctrl+` `` on Windows/Linux, `` Cmd+` `` on Mac).

Type these one at a time and press Enter after each:

```bash
python --version
node --version
git --version
```

- If a version number prints (e.g. `Python 3.12.1`), it's installed.
- If you get "command not found" / "not recognized", you need to install that tool — instructions below.
- On some systems Python shows up as `python3` instead of `python` — try that too before assuming it's missing.

### Step 2: Install Python (if missing)

1. Go to https://www.python.org/downloads/
2. Download the latest **Python 3.12.x** installer for your OS.
3. Run it. **On Windows: tick the checkbox "Add Python to PATH" at the bottom of the first screen** — this is the #1 thing people forget.
4. Finish the install, close and reopen your terminal, run `python --version` again to confirm.

### Step 3: Install Node.js (if missing)

1. Go to https://nodejs.org/
2. Download the **LTS** version (not "Current").
3. Run the installer, accept defaults, finish.
4. Reopen your terminal, run `node --version` and `npm --version` to confirm (npm installs automatically with Node).

### Step 4: Install Git (if missing)

1. Go to https://git-scm.com/downloads
2. Download and run the installer for your OS, accepting default options.
3. Reopen your terminal, confirm with `git --version`.
4. If you've never used Git before, set your identity (replace with your info):

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### Step 5: Install helpful VS Code extensions

Open the Extensions panel (left sidebar, icon looks like 4 squares, or `Ctrl+Shift+X` / `Cmd+Shift+X`). Search for and install:

- **Python** (by Microsoft) — for Django/Python code
- **Pylance** — usually installs alongside Python, gives better autocomplete
- **ES7+ React/Redux/React-Native snippets** — handy React shortcuts
- **Prettier** — auto-formats code so it looks clean

### Step 6: Create a GitHub account and repository

Your proposal requires GitHub for source control (and it's how your team will collaborate).

1. If you don't have one, sign up at https://github.com
2. Click the **+** icon (top right) → **New repository**
3. Name it e.g. `plant-care-system`
4. Keep it **Private** (or Public, your choice) — don't add a README/gitignore yet, we'll do that locally
5. Click **Create repository** and keep the page open — you'll need the URL shown (looks like `https://github.com/yourname/plant-care-system.git`)

---

## PART C — Create the project folder

1. Pick a location on your computer (e.g. Desktop) and create a folder called `plant-care-system`.
2. In VS Code: **File → Open Folder** → select `plant-care-system`.
3. Open a terminal inside VS Code (it should now default to this folder). Confirm with:

```bash
pwd        # Mac/Linux — should show .../plant-care-system
cd         # Windows equivalent: just type "cd" with no args, or check the prompt path
```

---

## PART D — Set up the Django backend

### Step 1: Create a virtual environment

A virtual environment keeps this project's Python packages separate from everything else on your machine. Run inside `plant-care-system`:

```bash
python -m venv backend-env
```

This creates a `backend-env` folder. Don't touch its contents manually.

### Step 2: Activate the virtual environment

**Windows (PowerShell):**
```bash
backend-env\Scripts\activate
```
If PowerShell blocks this with a script-execution error, run this once first, then retry: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

**Windows (Command Prompt):**
```bash
backend-env\Scripts\activate.bat
```

**Mac/Linux:**
```bash
source backend-env/bin/activate
```

You'll know it worked because your terminal prompt now starts with `(backend-env)`. **You need to do this activation step every time you open a new terminal to work on the backend.**

### Step 3: Install Django and required packages

With the venv active:

```bash
pip install django djangorestframework django-cors-headers pillow
```

- `django` — the web framework
- `djangorestframework` — turns Django into a REST API
- `django-cors-headers` — lets your React app (different port) talk to Django without being blocked
- `pillow` — handles image files (needed for leaf-image uploads)

### Step 4: Create the Django project

Still inside `plant-care-system`, with venv active:

```bash
django-admin startproject config backend
```

This creates a `backend/` folder containing a `config/` folder (settings) and a `manage.py` file. Naming the project `config` (instead of the default project name) keeps things tidy since we'll add "apps" alongside it.

### Step 5: Move into the backend and test the server

```bash
cd backend
python manage.py runserver
```

Open a browser to `http://127.0.0.1:8000/` — you should see Django's "The install worked successfully!" rocket page. 

Press `Ctrl+C` in the terminal to stop the server when you're done checking.

### Step 6: Create your Django apps

Django organizes code into "apps." Based on your proposal's modules (Authentication, Plant Management, Care History), create these (still inside `backend/`, venv active):

```bash
python manage.py startapp accounts
python manage.py startapp plants
python manage.py startapp detection
```

- `accounts` → user registration/login
- `plants` → "My Plants" + care history
- `detection` → image upload + dummy/AI prediction logic

### Step 7: Register the apps and packages in settings

Open `backend/config/settings.py` in VS Code. Find `INSTALLED_APPS = [...]` and add these entries inside the list:

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'accounts',
    'plants',
    'detection',
]
```

Now find `MIDDLEWARE = [...]` and add `'corsheaders.middleware.CorsMiddleware',` as the **very first** item in the list:

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    ...
]
```

At the bottom of `settings.py`, add:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

(`MEDIA_ROOT` is where uploaded leaf images will be stored.)

### Step 8: Run initial migrations

Django ships with built-in tables (users, sessions, etc.). Create them:

```bash
python manage.py migrate
```

### Step 9: Create an admin superuser

This lets you log into Django's built-in admin panel to inspect your data later:

```bash
python manage.py createsuperuser
```

Follow the prompts (username, email, password).

Leave this terminal — we'll come back to it. **Leave the venv active tab open**; you'll use `python manage.py runserver` from `backend/` whenever you want the API running.

---

## PART E — Set up the React frontend

Open a **second, new terminal** in VS Code (click the `+` icon in the terminal panel) — leave the Django one alone. Navigate back to the project root:

```bash
cd ..    # if you're inside backend/, this takes you back to plant-care-system/
```

### Step 1: Create the React app with Vite

Vite is a fast, modern way to start a React project (simpler than older tools like create-react-app):

```bash
npm create vite@latest frontend -- --template react
```

Press Enter to confirm any prompts.

### Step 2: Install dependencies

```bash
cd frontend
npm install
```

### Step 3: Install React Router and an HTTP client

```bash
npm install react-router-dom axios
```

- `react-router-dom` — handles page navigation (Login, Dashboard, Upload, etc.)
- `axios` — makes it easy to call your Django API from React

### Step 4: Install a styling tool (your proposal lists Bootstrap or Tailwind — pick one)

**Option A — Tailwind CSS** (utility-first, more modern, steeper learning curve):
```bash
npm install tailwindcss @tailwindcss/vite
```
Then in `frontend/vite.config.js`, add the Tailwind plugin (I'll walk you through this in detail once you tell me which you picked).

**Option B — Bootstrap** (component-based, faster to pick up):
```bash
npm install bootstrap
```
Then add this single line at the top of `frontend/src/main.jsx`:
```js
import 'bootstrap/dist/css/bootstrap.min.css';
```

### Step 5: Test the React app

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`) — you should see the default Vite + React starter page spinning a React logo.

Press `Ctrl+C` to stop when done checking.

---

## PART F — Connect Git and push to GitHub

Back in a terminal at the **project root** (`plant-care-system/`, not inside backend or frontend):

### Step 1: Create a `.gitignore`

This stops junk (virtual envs, node_modules, database files) from being uploaded. Create a file named `.gitignore` in the project root with this content:

```
# Python / Django
backend-env/
__pycache__/
*.pyc
backend/db.sqlite3
backend/media/

# Node / React
frontend/node_modules/
frontend/dist/

# Editor
.vscode/
.DS_Store
```

### Step 2: Initialize Git and push

```bash
git init
git add .
git commit -m "Initial commit: Django + React project setup"
git branch -M main
git remote add origin https://github.com/yourname/plant-care-system.git
git push -u origin main
```

(Replace the URL with your actual repo URL from Part B, Step 6.)

---

## PART G — Verify everything together

1. Terminal 1: `cd backend` → activate venv → `python manage.py runserver` → confirm `http://127.0.0.1:8000/` loads.
2. Terminal 2: `cd frontend` → `npm run dev` → confirm `http://localhost:5173` loads.
3. Both running at once, in separate terminals, is your normal daily workflow from now on.

**Checkpoint — you now have:**
- A Django backend with 3 apps scaffolded (accounts, plants, detection)
- A React frontend with routing and HTTP-client libraries ready
- CORS configured so they can talk to each other
- Everything committed to GitHub

This completes Sprint 1 from your proposal.

---

## PART H — Roadmap: what comes next (Sprints 2–6 overview)

You don't need to do these now — just so you know where this is heading:

| Sprint | Focus | What it involves |
|---|---|---|
| 2 | Database models & API | Define `Plant` and `CareHistory` models in `plants/models.py`, build DRF serializers + viewsets, test endpoints with Postman |
| 3 | Frontend pages + dummy detection | Build React pages (Login, Dashboard, Upload, Result), connect via axios, backend returns a fake/rule-based prediction |
| 4 | My Plants + auth | Real login/register flow (likely token-based auth via DRF), save/view/delete plants, care-history timeline |
| 5 | Polish | Validation, error handling, loading states, styling pass |
| 6 (optional) | Real AI model | Swap the dummy prediction service for a trained TensorFlow/PyTorch model (e.g. on the PlantVillage dataset) |

I can walk you through each sprint in this same step-by-step style when you're ready for it.

---

## Troubleshooting quick reference

- **`python`/`node`/`git` not recognized** → reopen terminal after install, or reinstall checking the "Add to PATH" box.
- **`pip install` fails** → make sure `(backend-env)` shows in your prompt; if not, the venv isn't active.
- **React can't reach Django (CORS error in browser console)** → double check `CORS_ALLOWED_ORIGINS` in `settings.py` matches your Vite URL exactly (including port).
- **Port already in use** → another process is using 8000 or 5173; close the other terminal running it, or restart your computer.
