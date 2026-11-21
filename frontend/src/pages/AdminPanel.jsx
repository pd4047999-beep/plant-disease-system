import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, Leaf, ScanLine, Search, ShieldCheck, Sprout, Users } from 'lucide-react';
import api from '../api/axios';
import { getErrorMessage } from '../api/errors';
import Logo from '../components/Logo';
import SeverityPill from '../components/SeverityPill';
import { formatDate } from '../utils/format';

// Django's own admin lives on the same server as the API (without the "/api" part).
const SERVER = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

function StatCard({ label, value, delta, icon }) {
  return (
    <div className="pc-card pc-stat">
      <div className="pc-stat__top">
        <span>{label}</span>
        {icon}
      </div>
      <div className="pc-stat__value">
        <strong>{value.toLocaleString()}</strong>
        {delta && <span>{delta}</span>}
      </div>
    </div>
  );
}

function AdminPanel({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/auth/admin-overview/')
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Could not load admin data.')));
  }, []);

  const stats = data?.stats;
  const q = query.trim().toLowerCase();
  const rows = (data?.recent_scans || []).filter((s) =>
    `${s.user} ${s.plant_type} ${s.diagnosis}`.toLowerCase().includes(q)
  );

  return (
    <div className="pc-admin">
      <aside className="pc-admin__side">
        <div className="pc-brand pc-brand--light">
          <Logo size={38} />
          <span>PlantCare AI</span>
        </div>

        <nav>
          <span className="pc-admin__link pc-admin__link--active"><LayoutDashboard size={18} /> Dashboard</span>
          <a className="pc-admin__link" href={`${SERVER}/admin/auth/user/`} target="_blank" rel="noreferrer">
            <Users size={18} /> Users
          </a>
          <a className="pc-admin__link" href={`${SERVER}/admin/plants/plant/`} target="_blank" rel="noreferrer">
            <Sprout size={18} /> Plants
          </a>
          <a className="pc-admin__link" href={`${SERVER}/admin/plants/carehistory/`} target="_blank" rel="noreferrer">
            <ScanLine size={18} /> Scans
          </a>
        </nav>

        <Link to="/dashboard" className="pc-admin__link pc-admin__back">
          <ArrowLeft size={18} /> Back to app
        </Link>
      </aside>

      <div className="pc-admin__main">
        <header className="pc-admin__top">
          <h1>Admin Dashboard</h1>
          <div className="pc-admin__top-right">
            <div className="pc-search">
              <Search size={18} />
              <input
                className="pc-input"
                placeholder="Search the log..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <span className="pc-avatar" aria-hidden="true">{(user?.username || '?').charAt(0).toUpperCase()}</span>
          </div>
        </header>

        <div className="pc-admin__body">
          {error && <div className="pc-alert pc-alert--error">{error}</div>}
          {!data && !error && <div className="pc-loading"><div className="pc-spinner" /></div>}

          {stats && (
            <>
              <div className="pc-stats">
                <StatCard label="Total Users" value={stats.total_users} delta={`+${stats.new_users_week} this week`} icon={<Users size={20} />} />
                <StatCard label="Total Scans" value={stats.total_scans} delta={`+${stats.new_scans_week} this week`} icon={<ScanLine size={20} />} />
                <StatCard label="Plants Tracked" value={stats.plants_tracked} delta={`+${stats.new_plants_week} this week`} icon={<Leaf size={20} />} />
                <StatCard label="Diseases Indexed" value={stats.diseases_indexed} delta="model classes" icon={<ShieldCheck size={20} />} />
              </div>

              <div className="pc-card pc-tablecard">
                <h2>Recent Diagnostic Log (Global Audit)</h2>
                <div className="pc-tablewrap">
                  <table className="pc-table">
                    <thead>
                      <tr>
                        <th>USER</th>
                        <th>PLANT TYPE</th>
                        <th>DIAGNOSIS</th>
                        <th>CONFIDENCE</th>
                        <th>SEVERITY</th>
                        <th>DATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 && (
                        <tr><td colSpan="6" className="pc-muted">No scans to show.</td></tr>
                      )}
                      {rows.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <span className="pc-user">
                              <span className="pc-avatar pc-avatar--sm" aria-hidden="true">{s.user.charAt(0).toUpperCase()}</span>
                              {s.user}
                            </span>
                          </td>
                          <td>{s.plant_type}</td>
                          <td>{s.diagnosis}</td>
                          <td className="pc-conf">{s.confidence_score}%</td>
                          <td><SeverityPill severity={s.severity} /></td>
                          <td>{formatDate(s.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
