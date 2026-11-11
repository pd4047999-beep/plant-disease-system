
import { useEffect, useState } from 'react';
import SeverityBadge from '../components/SeverityBadge';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const severityRank = {
  severe: 0,
  moderate: 1,
  mild: 2,
  healthy: 3
};

function MyPlants() {
  const [plants, setPlants] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPlants = async () => {
    try {
      setError('');
      const res = await api.get('/plants/');
      setPlants(res.data);
    } catch (err) {
      console.error('Failed to load plants:', err);
      setError('Could not load plants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlants();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(
      'Delete this plant and all its history? This cannot be undone.'
    )) return;

    try {
      await api.delete(`/plants/${id}/`);
      await loadPlants();
    } catch (err) {
      console.error('Failed to delete plant:', err);
      alert('Could not delete this plant. Please try again.');
    }
  };

  const filtered = plants.filter((p) =>
    `${p.nickname || ''} ${p.species_name || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') {
      return (a.nickname || a.species_name || '')
        .localeCompare(b.nickname || b.species_name || '');
    }

    if (sortBy === 'attention') {
      const sa = a.history?.[0]
        ? severityRank[a.history[0].severity] ?? 4
        : 4;

      const sb = b.history?.[0]
        ? severityRank[b.history[0].severity] ?? 4
        : 4;

      return sa - sb;
    }

    return new Date(b.created_at) - new Date(a.created_at);
  });

  if (loading) {
    return (
      <div className="container py-4">
        <div className="spinner-border text-success" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-success" onClick={loadPlants}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h3 className="mb-3">My Plants</h3>

      <div className="d-flex gap-2 mb-4">
        <input
          className="form-control"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="form-select"
          style={{ maxWidth: '220px' }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="recent">Recently Added</option>
          <option value="name">Name A–Z</option>
          <option value="attention">Needs Attention First</option>
        </select>
      </div>

      <div className="row">
        {sorted.length === 0 && (
          <p>No plants match your search.</p>
        )}

        {sorted.map((plant) => {
          const latest = plant.history?.[0];

          return (
            <div className="col-md-4 mb-3" key={plant.id}>
              <div className="card p-3 position-relative">
                <button
                  className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2"
                  onClick={() => handleDelete(plant.id)}
                >
                  ✕
                </button>

                <h5>{plant.nickname || plant.species_name}</h5>
                <p className="text-muted mb-1">
                  {plant.species_name}
                </p>

                {latest && (
                  <div className="mb-2">
                    <SeverityBadge severity={latest.severity} />
                  </div>
                )}

                <Link
                  to={`/plants/${plant.id}`}
                  className="btn btn-success btn-sm"
                >
                  View History
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MyPlants;
