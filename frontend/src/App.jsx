import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import api from './api/axios';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/Upload';
import ResultPage from './pages/Result';
import MyPlants from './pages/MyPlants';
import PlantDetail from './pages/PlantDetail';
import AdminPanel from './pages/AdminPanel';

// Pages for logged-in users: top navigation bar + page content.
function Protected({ user, onLogout, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <Navbar user={user} onLogout={onLogout} />
      {children}
    </>
  );
}

// The admin panel has its own layout (sidebar) and is only for staff accounts.
function AdminOnly({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_staff) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  const [user, setUser] = useState(undefined); // undefined = still checking

  useEffect(() => {
    api.get('/auth/whoami/')
      .then((res) => setUser(res.data.username ? res.data : null))
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) {
    return <div className="pc-loading"><div className="pc-spinner" /></div>;
  }

  const logout = () => setUser(null);
  const guard = (page) => (
    <Protected user={user} onLogout={logout}>{page}</Protected>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register onLogin={setUser} />} />
        <Route path="/dashboard" element={guard(<Dashboard user={user} />)} />
        <Route path="/upload" element={guard(<UploadPage />)} />
        <Route path="/result" element={guard(<ResultPage />)} />
        <Route path="/my-plants" element={guard(<MyPlants />)} />
        <Route path="/plants/:id" element={guard(<PlantDetail />)} />
        <Route path="/admin-panel" element={<AdminOnly user={user}><AdminPanel user={user} /></AdminOnly>} />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
