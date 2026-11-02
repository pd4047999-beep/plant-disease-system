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
