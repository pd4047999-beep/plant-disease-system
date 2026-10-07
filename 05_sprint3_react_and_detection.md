# Mentor Guide: Sprint 3 — React Pages, Login, and Dummy Detection

By the end of this guide: you can open your React app, log in, upload a leaf photo, get back a fake-but-realistic diagnosis, save it, and see it appear on a dashboard — all talking to your real Django API from Sprint 2.

### One thing we need to resolve first

Your Sprint 2 API requires a logged-in user (`IsAuthenticated`) for every Plant/CareHistory request. That means React needs *some* way to log in before it can do anything — we can't fully defer login to Sprint 4 like the original rough roadmap suggested. So this sprint builds a **minimal, working login** (just enough to authenticate), and Sprint 4 will come back and add registration, nicer validation, and polish. This is normal — real projects adjust sprint boundaries once you hit a real dependency like this.

---

## PART A — Backend: add login/logout endpoints

Django's session login needs a tiny bit of custom wiring to work cleanly with a separate React app (different port = different "origin"). We'll add this to your `accounts` app.

### Step 1: Write the auth views

Open `backend/accounts/views.py` and replace its contents with:

```python
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFView(APIView):
    """Visiting this sets a CSRF cookie in the browser, required before POSTing anywhere."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"detail": "CSRF cookie set"})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return Response({"id": user.id, "username": user.username})
        return Response({"error": "Invalid username or password."}, status=400)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"detail": "Logged out."})


class WhoAmIView(APIView):
    """React calls this on load to check: is anyone currently logged in?"""
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            return Response({"id": request.user.id, "username": request.user.username})
        return Response({"id": None, "username": None})
```

### Step 2: Wire up the URLs

Create `backend/accounts/urls.py`:

```python
from django.urls import path
from .views import CSRFView, LoginView, LogoutView, WhoAmIView

urlpatterns = [
    path('csrf/', CSRFView.as_view()),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('whoami/', WhoAmIView.as_view()),
]
```

### Step 3: Create the dummy detection endpoint

Open `backend/detection/views.py` and replace its contents with:

```python
import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

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
        # Dummy logic: just pick a random result.
        # This is where real image analysis would go in a future sprint.
        result = random.choice(DUMMY_RESULTS)
        return Response(result)
```

Create `backend/detection/urls.py`:

```python
from django.urls import path
from .views import DetectView

urlpatterns = [
    path('detect/', DetectView.as_view()),
]
```

### Step 4: Register all the URL includes

Open `backend/config/urls.py` and make sure it looks like this:

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('plants.urls')),
    path('api/', include('detection.urls')),
    path('api-auth/', include('rest_framework.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### Step 5: Allow credentials in CORS

Open `backend/config/settings.py` and find your `CORS_ALLOWED_ORIGINS` line from Sprint 1. Add this right below it:

```python
CORS_ALLOW_CREDENTIALS = True
```

This is required so the browser is allowed to send/receive the session cookie across the React (port 5173) ↔ Django (port 8000) boundary.

### Step 6: Quick backend sanity check

```bash
python manage.py runserver
```

Visit `http://127.0.0.1:8000/api/auth/whoami/` — you should see `{"id": null, "username": null}` since nothing has logged in yet. That confirms the endpoint works.

---

## PART B — Frontend: set up API communication

### Step 1: Create a configured axios instance

Create a new file `frontend/src/api/axios.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  withCredentials: true, // sends/receives the session cookie
});

// Read the CSRF token Django set in a cookie, and attach it to every
// unsafe request (POST/PUT/PATCH/DELETE), as Django requires.
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

api.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

export default api;
```

### Step 2: Install React Router if you haven't already

(You installed this in Sprint 1, but confirm:)

```bash
cd frontend
npm install react-router-dom axios
```

---

## PART C — Build the Login page

Create `frontend/src/pages/Login.jsx`:

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Step 1: get a CSRF cookie before the first POST
      await api.get('/auth/csrf/');
      // Step 2: actually log in
      const res = await api.post('/auth/login/', { username, password });
      onLogin(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="card p-4" style={{ width: '350px' }}>
        <h3 className="text-center mb-3">🌿 Plant Care Login</h3>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-success w-100">Log In</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
```

For now, log in using the **superuser account** you created in Sprint 1 (`python manage.py createsuperuser`). Real self-service registration is a Sprint 4 task.

---

## PART D — Build the Upload & Detection page

Create `frontend/src/pages/Upload.jsx`:

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/detect/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Pass the result AND the original file to the Result page via navigation state
      navigate('/result', { state: { result: res.data, file } });
    } catch (err) {
      setError('Something went wrong analyzing the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '500px' }}>
      <h3 className="mb-4">Upload a Leaf Photo</h3>
      {error && <div className="alert alert-danger">{error}</div>}

      {!preview ? (
        <div className="border border-2 border-dashed rounded p-5 text-center">
          <p>Drag & drop a leaf photo here, or click to browse</p>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>
      ) : (
        <div className="text-center">
          <img src={preview} alt="preview" className="img-fluid rounded mb-3" style={{ maxHeight: '300px' }} />
          <br />
          <button className="btn btn-outline-secondary me-2" onClick={() => { setFile(null); setPreview(null); }}>
            Remove
          </button>
          <button className="btn btn-success" onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Leaf'}
          </button>
        </div>
      )}
    </div>
  );
}

export default UploadPage;
```

---

## PART E — Build the Result page

Create `frontend/src/pages/Result.jsx`:

```jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../api/axios';

function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);

  if (!state || !state.result) {
    return (
      <div className="container py-5">
        <p>No result to show. Please upload a leaf photo first.</p>
        <button className="btn btn-success" onClick={() => navigate('/upload')}>Go to Upload</button>
      </div>
    );
  }

  const { result, file } = state;

  const severityColor = {
    healthy: 'success',
    mild: 'warning',
    moderate: 'orange',
    severe: 'danger',
  }[result.severity] || 'secondary';

  const handleSave = async () => {
    try {
      // Step 1: create (or reuse) the Plant
      const plantRes = await api.post('/plants/', {
        species_name: result.species_name,
        nickname: nickname || '',
      });

      // Step 2: create the CareHistory entry, attaching the same image
      const formData = new FormData();
      formData.append('plant', plantRes.data.id);
      formData.append('image', file);
      formData.append('detected_condition', result.detected_condition);
      formData.append('confidence_score', result.confidence_score);
      formData.append('severity', result.severity);
      formData.append('recommendation', result.recommendation);

      await api.post('/care-history/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSaved(true);
    } catch (err) {
      alert('Could not save this plant. Please try again.');
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '600px' }}>
      <div className="card p-4">
        <h3>{result.species_name}</h3>
        <h5 className="text-muted">{result.detected_condition}</h5>
        <p>Confidence: {result.confidence_score}%</p>
        <span className={`badge bg-${severityColor} mb-3`}>{result.severity.toUpperCase()}</span>

        <div className="bg-light border rounded p-3 mb-3">
          <strong>Recommended Care:</strong>
          <p className="mb-0">{result.recommendation}</p>
        </div>

        {!saved ? (
          <>
            <input
              className="form-control mb-2"
              placeholder="Give this plant a nickname (optional)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <button className="btn btn-success me-2" onClick={handleSave}>Save to My Plants</button>
            <button className="btn btn-outline-secondary" onClick={() => navigate('/upload')}>Scan Another Leaf</button>
          </>
        ) : (
          <>
            <div className="alert alert-success">Saved!</div>
            <button className="btn btn-success" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          </>
        )}
      </div>
    </div>
  );
}

export default ResultPage;
```

---

## PART F — Build a simple Dashboard page

Create `frontend/src/pages/Dashboard.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

function Dashboard() {
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    api.get('/plants/').then((res) => setPlants(res.data));
  }, []);

  return (
    <div className="container py-5">
      <h3>Your Plants</h3>
      <Link to="/upload" className="btn btn-success mb-4">+ Scan a New Plant</Link>

      <div className="row">
        {plants.length === 0 && <p>No plants yet — scan your first one!</p>}
        {plants.map((plant) => {
          const latest = plant.history[0];
          return (
            <div className="col-md-4 mb-3" key={plant.id}>
              <div className="card p-3">
                <h5>{plant.nickname || plant.species_name}</h5>
                <p className="text-muted mb-1">{plant.species_name}</p>
                {latest && (
                  <span className={`badge bg-secondary mb-2`}>{latest.severity}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
```

---

## PART G — Wire up routing with login protection

Replace `frontend/src/App.jsx` with:

```jsx
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './api/axios';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/Upload';
import ResultPage from './pages/Result';

function App() {
  const [user, setUser] = useState(undefined); // undefined = still checking

  useEffect(() => {
    api.get('/auth/whoami/').then((res) => {
      setUser(res.data.username ? res.data : null);
    });
  }, []);

  if (user === undefined) return <p className="text-center mt-5">Loading...</p>;

  const ProtectedRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

Make sure Bootstrap is imported — open `frontend/src/main.jsx` and confirm this line is near the top (from Sprint 1):

```javascript
import 'bootstrap/dist/css/bootstrap.min.css';
```

---

## PART H — Test the full flow

1. Terminal 1: `cd backend` → activate venv → `python manage.py runserver`
2. Terminal 2: `cd frontend` → `npm run dev`
3. Open `http://localhost:5173` — you should be redirected to `/login`.
4. Log in with your superuser credentials.
5. You should land on the Dashboard (empty, or showing plants if you made any via the browsable API in Sprint 2).
6. Click **+ Scan a New Plant** → upload any image → click **Analyze Leaf**.
7. You should land on the Result page showing one of the 4 hardcoded dummy results.
8. Optionally type a nickname → click **Save to My Plants**.
9. Click **Go to Dashboard** → your new plant should now appear in the grid.

If all 9 steps work, Sprint 3 is functionally complete.

---

## Troubleshooting

- **CORS error in browser console** → confirm `CORS_ALLOW_CREDENTIALS = True` is set and `CORS_ALLOWED_ORIGINS` includes `http://localhost:5173` exactly.
- **403 Forbidden on login POST** → the CSRF cookie step was skipped or failed. Confirm `Login.jsx` calls `api.get('/auth/csrf/')` before `api.post('/auth/login/')`.
- **Login succeeds but Dashboard still redirects to /login** → check the browser's dev tools → Application → Cookies, confirm a `sessionid` cookie exists for `127.0.0.1:8000`. If missing, `withCredentials: true` may be missing from `axios.js`.
- **Image doesn't show on Result/Dashboard** → remember `file` is only available right after upload (held in React state/navigation); once you navigate away and back, the browser doesn't retain it — this is expected and fine, since the saved image is now served from Django's media folder instead.
- **"No result to show" on Result page after a refresh** → expected. The result is passed via React Router's in-memory navigation state, which clears on a hard refresh. Don't refresh that page mid-flow.

---

## Checkpoint — what you now have

- A working login (session-based, via your existing superuser)
- Protected routes that redirect to login if you're not authenticated
- A functional Upload → dummy-Analyze → Result → Save flow, fully connected to your real Sprint 2 API
- A Dashboard that reads real data back from the database

This completes Sprint 3. Commit it:

```bash
cd ..
git add .
git commit -m "Sprint 3: React pages, session login, dummy detection, full upload-to-save flow"
git push
```

Sprint 4 next: real self-service registration (not just the superuser), the **My Plants** grid with search/sort, the **Plant Detail/Care History timeline** screen, and the **Admin Panel**. Let me know once you've run through Part H, and tell me specifically which step (if any) didn't behave as expected.
