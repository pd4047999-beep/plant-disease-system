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
