import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Logo from './Logo';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch (err) {
      // Even if the server call fails, sign the user out of the app.
    }
    onLogout();
    navigate('/login');
  };

  // A link is "active" for its own page and the pages that belong to it.
  const isActive = (path) => {
    if (path === '/upload') return pathname === '/upload' || pathname === '/result';
    if (path === '/my-plants') return pathname === '/my-plants' || pathname.startsWith('/plants/');
    return pathname === path;
  };

  const linkClass = (path) => `pc-navlink${isActive(path) ? ' pc-navlink--active' : ''}`;
  const initial = (user?.username || '?').charAt(0).toUpperCase();

  return (
    <header className="pc-navbar">
      <div className="pc-navbar__inner">
        <Link to="/dashboard" className="pc-brand">
          <Logo />
          <span>PlantCare AI</span>
        </Link>

        <nav className="pc-navlinks">
          <Link to="/dashboard" className={linkClass('/dashboard')}>Dashboard</Link>
          <Link to="/upload" className={linkClass('/upload')}>Detect Disease</Link>
          <Link to="/my-plants" className={linkClass('/my-plants')}>My Plants</Link>
          {user?.is_staff && (
            <Link to="/admin-panel" className={linkClass('/admin-panel')}>Admin Panel</Link>
          )}
        </nav>

        <div className="pc-navuser">
          <span className="pc-navuser__name">{user?.username}</span>
          <span className="pc-avatar" aria-hidden="true">{initial}</span>
          <button className="pc-linkbtn" onClick={handleLogout}>Log out</button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
