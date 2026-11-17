import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getErrorMessage } from '../api/errors';
import AuthLayout from '../components/AuthLayout';

function Login({ onLogin }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.get('/auth/csrf/');
      const res = await api.post('/auth/login/', { username: identifier.trim(), password });
      onLogin(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid email/username or password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="pc-card pc-auth__card">
        <h2>Welcome back</h2>
        <p className="pc-auth__sub">Please enter your details to access your garden</p>

        {error && <div className="pc-alert pc-alert--error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="pc-field">
            <label className="pc-label" htmlFor="identifier">Email or Username</label>
            <input
              id="identifier"
              className="pc-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="pc-field">
            <label className="pc-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="pc-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="pc-btn pc-btn--primary pc-btn--block" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="pc-auth__switch">
          New to PlantCare? <Link to="/register" className="pc-link">Create an account</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Login;
