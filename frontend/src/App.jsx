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
