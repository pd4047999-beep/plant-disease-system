import { useState } from 'react';
import { getErrorMessage } from '../api/errors';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

function Register({ onLogin }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    const { confirm, ...payload } = form; // don't send "confirm" to the server
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
          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <input name="confirm" type="password" className="form-control" onChange={handleChange} required />
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
