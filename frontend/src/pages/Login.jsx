import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      // Step 1: Get a CSRF cookie before the first POST
      await api.get('/auth/csrf/');

      // Step 2: Log in
      const res = await api.post('/auth/login/', {
        username,
        password,
      });

      // Step 3: Update the login state
      onLogin(res.data);

      // Step 4: Navigate to the dashboard
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid username or password.');
    }
  };

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh' }}
    >
      <div className="card p-4" style={{ width: '350px' }}>
        <h3 className="text-center mb-3">
          🌿 Plant Care Login
        </h3>

        {error && (
          <div className="alert alert-danger py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
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

          <button
            type="submit"
            className="btn btn-success w-100"
          >
            Log In
          </button>
        </form>

        {/* Register link */}
        <p className="text-center mt-3 mb-0">
          <Link to="/register">
            Don't have an account? Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
