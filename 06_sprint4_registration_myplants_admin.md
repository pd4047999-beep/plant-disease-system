# Mentor Guide: Sprint 4 — Registration, My Plants, Care History Timeline, Admin Panel

This sprint finishes the core user-facing app: real sign-up (no more relying only on the superuser), a browsable My Plants grid with search/sort/delete, the Care History timeline screen, a shared navigation bar, and the Admin Panel.

---

## PART A — Real registration

### Step 1: Backend serializer

Create `backend/accounts/serializers.py`:

```python
from django.contrib.auth.models import User
from rest_framework import serializers


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
```

`create_user` (not `create`) is important — it properly hashes the password instead of storing it as plain text.

### Step 2: Backend view

Open `backend/accounts/views.py` and add these two lines near the top imports:

```python
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import RegisterSerializer
```

Then add this class anywhere in the file:

```python
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
```

### Step 3: URL

Open `backend/accounts/urls.py` and add the import and route:

```python
from .views import CSRFView, LoginView, LogoutView, WhoAmIView, RegisterView

urlpatterns = [
    path('csrf/', CSRFView.as_view()),
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('whoami/', WhoAmIView.as_view()),
]
```

### Step 4: Frontend Register page

Create `frontend/src/pages/Register.jsx`:

```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

function Register({ onLogin }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.get('/auth/csrf/');
      await api.post('/auth/register/', form);
      // auto-login right after successful registration
      const res = await api.post('/auth/login/', { username: form.username, password: form.password });
      onLogin(res.data);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      setError(data ? JSON.stringify(data) : 'Registration failed.');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="card p-4" style={{ width: '350px' }}>
        <h3 className="text-center mb-3">🌿 Create Account</h3>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input name="username" className="form-control" onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-control" onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input name="password" type="password" className="form-control" onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-success w-100">Create Account</button>
        </form>
        <p className="text-center mt-3 mb-0">
          <Link to="/login">Already have an account? Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
```

### Step 5: Link to it from Login

In `frontend/src/pages/Login.jsx`, add this just above the closing `</div>` of the card (after the `</form>`):

```jsx
<p className="text-center mt-3 mb-0">
  <Link to="/register">Don't have an account? Register</Link>
</p>
```

And add the import at the top: `import { useNavigate, Link } from 'react-router-dom';` (replacing the existing `useNavigate`-only import).

---

## PART B — Shared navigation bar

Your proposal's Dashboard/Upload/My Plants screens all share a top nav. Create `frontend/src/components/Navbar.jsx`:

```jsx
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await api.post('/auth/logout/');
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand bg-light px-4 mb-3">
      <Link className="navbar-brand" to="/dashboard">🌿 Plant Care</Link>
      <div className="navbar-nav me-auto">
        <Link className="nav-link" to="/dashboard">Dashboard</Link>
        <Link className="nav-link" to="/upload">Scan</Link>
        <Link className="nav-link" to="/my-plants">My Plants</Link>
      </div>
      <span className="me-3 text-muted">Hi, {user?.username}</span>
      <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>Logout</button>
    </nav>
  );
}

export default Navbar;
```

---

## PART C — My Plants screen (search, sort, delete)

Create `frontend/src/pages/MyPlants.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const severityRank = { severe: 0, moderate: 1, mild: 2, healthy: 3 };

function MyPlants() {
  const [plants, setPlants] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const loadPlants = () => {
    api.get('/plants/').then((res) => setPlants(res.data));
  };

  useEffect(loadPlants, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plant and all its history? This cannot be undone.')) return;
    await api.delete(`/plants/${id}/`);
    loadPlants();
  };

  const filtered = plants.filter((p) =>
    (p.nickname + p.species_name).toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return (a.nickname || a.species_name).localeCompare(b.nickname || b.species_name);
    if (sortBy === 'attention') {
      const sa = a.history[0] ? severityRank[a.history[0].severity] : 4;
      const sb = b.history[0] ? severityRank[b.history[0].severity] : 4;
      return sa - sb;
    }
    return new Date(b.created_at) - new Date(a.created_at); // recent first (default)
  });

  return (
    <div className="container py-4">
      <h3 className="mb-3">My Plants</h3>

      <div className="d-flex gap-2 mb-4">
        <input
          className="form-control"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="form-select" style={{ maxWidth: '220px' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="recent">Recently Added</option>
          <option value="name">Name A–Z</option>
          <option value="attention">Needs Attention First</option>
        </select>
      </div>

      <div className="row">
        {sorted.length === 0 && <p>No plants match your search.</p>}
        {sorted.map((plant) => {
          const latest = plant.history[0];
          return (
            <div className="col-md-4 mb-3" key={plant.id}>
              <div className="card p-3 position-relative">
                <button
                  className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2"
                  onClick={() => handleDelete(plant.id)}
                >
                  ✕
                </button>
                <h5>{plant.nickname || plant.species_name}</h5>
                <p className="text-muted mb-1">{plant.species_name}</p>
                {latest && <span className="badge bg-secondary mb-2">{latest.severity}</span>}
                <Link to={`/plants/${plant.id}`} className="btn btn-success btn-sm">View History</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MyPlants;
```

---

## PART D — Plant Detail / Care History timeline screen

### Step 1: Allow editing notes on the backend

Your `CareHistoryViewSet` from Sprint 2 already supports PATCH and DELETE out of the box (that's what `ModelViewSet` gives you for free) — no backend changes needed here.

### Step 2: Build the page

Create `frontend/src/pages/PlantDetail.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plant, setPlant] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');

  const loadPlant = () => {
    api.get(`/plants/${id}/`).then((res) => setPlant(res.data));
  };

  useEffect(loadPlant, [id]);

  if (!plant) return <p className="container py-4">Loading...</p>;

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setNoteDraft(entry.note || '');
  };

  const saveNote = async (entryId) => {
    await api.patch(`/care-history/${entryId}/`, { note: noteDraft });
    setEditingId(null);
    loadPlant();
  };

  const deleteEntry = async (entryId) => {
    if (!window.confirm('Delete this history entry?')) return;
    await api.delete(`/care-history/${entryId}/`);
    loadPlant();
  };

  const scanAgain = () => {
    // Pre-link the next scan to this existing plant instead of creating a new one
    navigate('/upload', { state: { plantId: plant.id } });
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>{plant.nickname || plant.species_name}</h3>
        <button className="btn btn-success" onClick={scanAgain}>Scan Again</button>
      </div>

      <div className="border-start border-3 ps-4">
        {plant.history.length === 0 && <p>No scans yet for this plant.</p>}
        {plant.history.map((entry) => (
          <div className="card mb-3 p-3" key={entry.id}>
            <div className="d-flex gap-3">
              <img src={entry.image} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover' }} className="rounded" />
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between">
                  <strong>{entry.detected_condition}</strong>
                  <span className="badge bg-secondary">{entry.severity}</span>
                </div>
                <small className="text-muted">{new Date(entry.created_at).toLocaleString()}</small>
                <p className="mb-1 mt-1">{entry.recommendation}</p>

                {editingId === entry.id ? (
                  <div className="d-flex gap-2">
                    <input
                      className="form-control form-control-sm"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                    />
                    <button className="btn btn-sm btn-success" onClick={() => saveNote(entry.id)}>Save</button>
                  </div>
                ) : (
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted fst-italic">{entry.note || 'No note'}</span>
                    <div>
                      <button className="btn btn-sm btn-link" onClick={() => startEdit(entry)}>✎ Edit note</button>
                      <button className="btn btn-sm btn-link text-danger" onClick={() => deleteEntry(entry.id)}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlantDetail;
```

### Step 3: Support "Scan Again" pre-linking in Upload and Result pages

Open `frontend/src/pages/Upload.jsx`. Add this import: `import { useLocation } from 'react-router-dom';` and inside the component, right after the existing hooks, add:

```jsx
const location = useLocation();
const plantId = location.state?.plantId;
```

Then in `handleAnalyze`, change the `navigate('/result', ...)` line to carry `plantId` forward:

```jsx
navigate('/result', { state: { result: res.data, file, plantId } });
```

Now open `frontend/src/pages/Result.jsx`. Change this line:
```jsx
const { result, file } = state;
```
to:
```jsx
const { result, file, plantId } = state;
```

And replace the `handleSave` function with this version, which reuses the existing plant when `plantId` is present instead of always creating a new one:

```jsx
const handleSave = async () => {
  try {
    let targetPlantId = plantId;

    if (!targetPlantId) {
      const plantRes = await api.post('/plants/', {
        species_name: result.species_name,
        nickname: nickname || '',
      });
      targetPlantId = plantRes.data.id;
    }

    const formData = new FormData();
    formData.append('plant', targetPlantId);
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
```

Finally, hide the nickname field when re-scanning an existing plant — wrap the `<input placeholder="Give this plant a nickname...` in a condition:

```jsx
{!plantId && (
  <input
    className="form-control mb-2"
    placeholder="Give this plant a nickname (optional)"
    value={nickname}
    onChange={(e) => setNickname(e.target.value)}
  />
)}
```

---

## PART E — Admin Panel

Good news: you already built this in **Sprint 2, Part D** — Django Admin at `http://127.0.0.1:8000/admin/` already satisfies the Admin Panel requirement (Users list, Plants overview, editable data). This is a legitimate, commonly-used implementation choice — you don't need to hand-build a second admin UI in React unless your teacher specifically requires it to visually match your mockup's custom sidebar design.

### Make it a bit more useful

Open `backend/plants/admin.py` and upgrade it slightly:

```python
from django.contrib import admin
from .models import Plant, CareHistory


@admin.register(Plant)
class PlantAdmin(admin.ModelAdmin):
    list_display = ('id', 'species_name', 'nickname', 'owner', 'created_at')
    search_fields = ('species_name', 'nickname', 'owner__username')
    list_filter = ('species_name',)


@admin.register(CareHistory)
class CareHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'plant', 'detected_condition', 'severity', 'confidence_score', 'created_at')
    list_filter = ('severity',)
    search_fields = ('detected_condition', 'plant__species_name')
```

`search_fields` and `list_filter` add a search box and sidebar filters to the admin — closer to the "Reference Data" browsing experience your mockup describes.

### If your teacher specifically wants a custom React admin panel

That's a larger, separate task (a new `/admin-panel` route, a way to flag a user as staff and check it in React, a users table hitting a new `UserViewSet`, etc.). Tell me and I'll write that as its own guide — don't build it speculatively if the Django Admin already satisfies the requirement.

---

## PART F — Wire the new pages into App.jsx

Open `frontend/src/App.jsx` and update it:

```jsx
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './api/axios';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/Upload';
import ResultPage from './pages/Result';
import MyPlants from './pages/MyPlants';
import PlantDetail from './pages/PlantDetail';

function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    api.get('/auth/whoami/').then((res) => {
      setUser(res.data.username ? res.data : null);
    });
  }, []);

  if (user === undefined) return <p className="text-center mt-5">Loading...</p>;

  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" />;
    return (
      <>
        <Navbar user={user} onLogout={() => setUser(null)} />
        {children}
      </>
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/register" element={<Register onLogin={setUser} />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
        <Route path="/my-plants" element={<ProtectedRoute><MyPlants /></ProtectedRoute>} />
        <Route path="/plants/:id" element={<ProtectedRoute><PlantDetail /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

Also update `frontend/src/pages/Dashboard.jsx` so its plant cards link to the detail screen — wrap each card in a `Link`:

```jsx
import { Link } from 'react-router-dom';
// ...inside the map, wrap the card:
<Link to={`/plants/${plant.id}`} className="text-decoration-none text-dark">
  <div className="card p-3">
    {/* existing card content */}
  </div>
</Link>
```

---

## PART G — Test everything

1. Start both servers (backend `runserver`, frontend `npm run dev`).
2. Log out if currently logged in, go to `/register`, create a brand-new (non-superuser) account — confirm it logs you in automatically.
3. Scan a plant, save it, confirm it appears on both Dashboard and My Plants.
4. On My Plants: type in the search box, confirm filtering works; change the sort dropdown, confirm order changes.
5. Click **View History** on a plant → confirm the timeline shows all scans, newest first.
6. Click **✎ Edit note** on an entry, type something, **Save** → confirm it persists after refreshing the page.
7. Click **Scan Again** from the detail page → upload a new photo → confirm the new scan is added to the *same* plant's history (not a new plant).
8. Delete a single history entry → confirm only that entry disappears.
9. Go back to My Plants, delete a whole plant → confirm it and all its history vanish.
10. Visit `http://127.0.0.1:8000/admin/`, log in with your superuser, confirm you can see/search/filter Plants and CareHistory there.

---

## Checkpoint — what you now have

- Full self-service registration, not just a superuser login
- A shared navbar across all protected pages
- My Plants with working search, sort, and delete-with-confirmation
- A real Care History timeline with inline note editing and per-entry deletion
- "Scan Again" correctly appends to an existing plant instead of duplicating it
- Admin Panel requirement satisfied via a search/filter-enabled Django Admin

This completes Sprint 4 — your app now implements all 7 screens from your proposal in some working form. Commit:

```bash
cd ..
git add .
git commit -m "Sprint 4: registration, My Plants, care history timeline, admin panel polish"
git push
```

According to your original roadmap, Sprint 5 is a polish pass (validation, error handling, loading states, styling), and Sprint 6 (optional) swaps the dummy detection for a real trained model. Let me know how Part G's test run goes, especially step 7 — that's the newest and most fragile piece of logic.
