import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera } from 'lucide-react';
import api from '../api/axios';
import PlantCard from '../components/PlantCard';
import { formatTime, timeAgo } from '../utils/format';

function Dashboard({ user }) {
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
    return <div className="pc-loading"><div className="pc-spinner" /></div>;
  }

  const scanned = plants.filter((p) => p.history.length > 0);
  const healthyCount = scanned.filter((p) => p.history[0].severity === 'healthy').length;
  const attentionCount = scanned.filter((p) => ['moderate', 'severe'].includes(p.history[0].severity)).length;
  const score = scanned.length ? Math.round((healthyCount / scanned.length) * 100) : null;

  const monitored = [...scanned]
    .sort((a, b) => new Date(b.history[0].created_at) - new Date(a.history[0].created_at))
    .slice(0, 4);

  const recent = plants
    .flatMap((p) => p.history.map((h) => ({ ...h, plantName: p.nickname || p.species_name, plantId: p.id })))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  let summary;
  if (score === null) {
    summary = "You haven't scanned any plants yet. Upload a leaf photo to get your first health check.";
  } else {
    summary = `Your garden health score is ${score}%: ${healthyCount} of ${scanned.length} saved plant${scanned.length === 1 ? '' : 's'} look${scanned.length === 1 ? 's' : ''} healthy`;
    summary += attentionCount > 0
      ? `, and ${attentionCount} need${attentionCount === 1 ? 's' : ''} attention.`
      : '.';
  }

  return (
    <div className="pc-container pc-page">
      <section className="pc-banner">
        <div>
          <h1>Welcome back, {user?.username}!</h1>
          <p>{summary} Scan a new leaf any time for an instant diagnostic report.</p>
        </div>
        <Link to="/upload" className="pc-btn pc-btn--white">
          <Camera size={18} /> Scan New Leaf
        </Link>
      </section>

      {error && <div className="pc-alert pc-alert--error" style={{ marginTop: 24 }}>{error}</div>}

      <div className="pc-section-head">
        <h2>My Monitored Plants</h2>
        <Link to="/my-plants" className="pc-link">
          View All Collection ({plants.length}) <ArrowRight size={16} />
        </Link>
      </div>

      {monitored.length === 0 ? (
        <div className="pc-card pc-empty">No scanned plants yet. Scan your first leaf to start monitoring.</div>
      ) : (
        <div className="pc-grid pc-grid--4">
          {monitored.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      )}

      <div className="pc-section-head">
        <h2>Recent Activity Log</h2>
      </div>

      {recent.length === 0 ? (
        <div className="pc-card pc-empty">Your scan activity will appear here.</div>
      ) : (
        <div className="pc-card pc-activity">
          {recent.map((scan) => {
            const alert = ['moderate', 'severe'].includes(scan.severity);
            return (
              <Link to={`/plants/${scan.plantId}`} className="pc-activity__row" key={scan.id}>
                <span className={`pc-dot pc-dot--${scan.severity}`} />
                <span className="pc-activity__text">
                  {scan.severity === 'healthy'
                    ? `Healthy scan recorded for ${scan.plantName}`
                    : `Detected '${scan.detected_condition}' on ${scan.plantName}`}
                </span>
                <span className="pc-chip-tag">{alert ? 'Diagnostic Alert' : 'Routine Check'}</span>
                <span className="pc-activity__time" title={timeAgo(scan.created_at)}>
                  {formatTime(scan.created_at)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
