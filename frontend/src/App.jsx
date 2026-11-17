import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

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

  // Check whether the user is already logged in
  useEffect(() => {
    api
      .get('/auth/whoami/')
      .then((res) => {
        setUser(res.data.username ? res.data : null);
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  // Show loading while checking the login status
  if (user === undefined) {
    return (
      <p className="text-center mt-5">
        Loading...
      </p>
    );
  }

  // Protect pages that require authentication
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return (
      <>
        <Navbar
          user={user}
          onLogout={() => setUser(null)}
        />
        {children}
      </>
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Login page */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={setUser} />
            )
          }
        />

        {/* Registration page */}
        <Route
          path="/register"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register onLogin={setUser} />
            )
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Upload a leaf image */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />

        {/* Detection result */}
        <Route
          path="/result"
          element={
            <ProtectedRoute>
              <ResultPage />
            </ProtectedRoute>
          }
        />

        {/* My Plants page */}
        <Route
          path="/my-plants"
          element={
            <ProtectedRoute>
              <MyPlants />
            </ProtectedRoute>
          }
        />

        {/* Individual plant details */}
        <Route
          path="/plants/:id"
          element={
            <ProtectedRoute>
              <PlantDetail />
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown URLs */}
        <Route
          path="*"
          element={
            <Navigate
              to={user ? '/dashboard' : '/login'}
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
