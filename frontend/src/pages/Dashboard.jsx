import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import SeverityBadge from '../components/SeverityBadge';

function Dashboard() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/plants/')
      .then((res) => setPlants(res.data))
      .catch(() => setError('Could not load your plants.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="container py-4"><div className="spinner-border text-success" /></div>;
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const allScans = plants.flatMap((p) =>
    p.history.map((h) => ({ ...h, plantName: p.nickname || p.species_name, plantId: p.id }))
  );
  const scansThisWeek = allScans.filter((s) => new Date(s.created_at).getTime() >= weekAgo).length;
  const needAttention = plants.filter(
    (p) => p.history[0] && ['moderate', 'severe'].includes(p.history[0].severity)
  );
  const recent = [...allScans]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Dashboard</h3>
        <Link to="/upload" className="btn btn-success">+ Scan a New Plant</Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        <div className="col-md-4 mb-2">
          <div className="card p-3 text-center">
            <h2 className="mb-0">{plants.length}</h2>
            <small className="text-muted">Saved plants</small>
          </div>
        </div>
        <div className="col-md-4 mb-2">
          <div className="card p-3 text-center">
            <h2 className="mb-0">{scansThisWeek}</h2>
            <small className="text-muted">Scans this week</small>
          </div>
        </div>
        <div className="col-md-4 mb-2">
          <div className="card p-3 text-center">
            <h2 className="mb-0">{needAttention.length}</h2>
            <small className="text-muted">Plants needing attention</small>
          </div>
        </div>
      </div>

      <h5>Recent Activity</h5>
      {recent.length === 0 ? (
        <p className="text-muted">No scans yet. Scan your first plant to get started!</p>
      ) : (
        <div className="list-group">
          {recent.map((s) => (
            <Link
              key={s.id}
              to={`/plants/${s.plantId}`}
              className="list-group-item list-group-item-action d-flex align-items-center gap-3"
            >
              <img src={s.image} alt="" width="48" height="48" className="rounded" style={{ objectFit: 'cover' }} />
              <div className="flex-grow-1">
                <strong>{s.plantName}</strong>
                <div className="text-muted small">{s.detected_condition}</div>
              </div>
              <SeverityBadge severity={s.severity} />
              <small className="text-muted">{new Date(s.created_at).toLocaleDateString()}</small>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
