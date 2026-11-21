import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getErrorMessage } from '../api/errors';
import AuthLayout from '../components/AuthLayout';

function Register({ onLogin }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    const { confirm, ...payload } = form; // do not send "confirm" to the server
    setLoading(true);
    try {
      await api.get('/auth/csrf/');
      await api.post('/auth/register/', payload);
      const res = await api.post('/auth/login/', {
        username: payload.username,
        password: payload.password,
      });
      onLogin(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="pc-card pc-auth__card">
        <h2>Create your account</h2>
        <p className="pc-auth__sub">Start tracking the health of your plants</p>

        {error && <div className="pc-alert pc-alert--error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="pc-field">
            <label className="pc-label" htmlFor="username">Username</label>
            <input id="username" name="username" className="pc-input" onChange={handleChange} autoComplete="username" required />
          </div>
          <div className="pc-field">
            <label className="pc-label" htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" className="pc-input" onChange={handleChange} autoComplete="email" required />
          </div>
          <div className="pc-field">
            <label className="pc-label" htmlFor="reg-password">Password</label>
            <input id="reg-password" name="password" type="password" className="pc-input" onChange={handleChange} autoComplete="new-password" required />
          </div>
          <div className="pc-field">
            <label className="pc-label" htmlFor="confirm">Confirm Password</label>
            <input id="confirm" name="confirm" type="password" className="pc-input" onChange={handleChange} autoComplete="new-password" required />
          </div>

          <button type="submit" className="pc-btn pc-btn--primary pc-btn--block" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="pc-auth__switch">
          Already have an account? <Link to="/login" className="pc-link">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Register;
