import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../api/axios';
import { getErrorMessage } from '../api/errors';
import PlantCard from '../components/PlantCard';
import { SEVERITY_LABEL, SEVERITY_RANK } from '../utils/format';

const FILTERS = ['all', 'healthy', 'mild', 'moderate', 'severe'];

function MyPlants() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const loadPlants = () => {
    api.get('/plants/')
      .then((res) => setPlants(res.data))
      .catch((err) => setError(getErrorMessage(err, 'Could not load your plants.')))
      .finally(() => setLoading(false));
  };

  useEffect(loadPlants, []);

  const handleDelete = async (plant) => {
    const name = plant.nickname || plant.species_name;
    if (!window.confirm(`Delete "${name}" and all of its history? This cannot be undone.`)) return;
    try {
      await api.delete(`/plants/${plant.id}/`);
      loadPlants();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete this plant.'));
    }
  };

  const severityOf = (p) => (p.history[0] ? p.history[0].severity : null);

  const counts = { all: plants.length };
  FILTERS.slice(1).forEach((key) => {
    counts[key] = plants.filter((p) => severityOf(p) === key).length;
  });

  const visible = plants
    .filter((p) => filter === 'all' || severityOf(p) === filter)
    .filter((p) => `${p.nickname} ${p.species_name}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.nickname || a.species_name).localeCompare(b.nickname || b.species_name);
      }
      if (sortBy === 'attention') {
        const ra = severityOf(a) ? SEVERITY_RANK[severityOf(a)] : 4;
        const rb = severityOf(b) ? SEVERITY_RANK[severityOf(b)] : 4;
        return ra - rb;
      }
      return new Date(b.created_at) - new Date(a.created_at); // recently added first
    });

  if (loading) {
    return <div className="pc-loading"><div className="pc-spinner" /></div>;
  }

  return (
    <div className="pc-container pc-page">
      <div className="pc-titlerow">
        <h1 className="pc-page-title">My Plants</h1>
        <span className="pc-countpill">
          {plants.length} Plant{plants.length === 1 ? '' : 's'} Monitored
        </span>
      </div>

      {error && <div className="pc-alert pc-alert--error">{error}</div>}

      <div className="pc-card pc-toolbar">
        <div className="pc-search">
          <Search size={18} />
          <input
            className="pc-input"
            placeholder="Search plant name or species..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="pc-chips">
          {FILTERS.map((key) => (
            <button
              key={key}
              className={`pc-chip${filter === key ? ' pc-chip--active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {key === 'all' ? 'All' : SEVERITY_LABEL[key]} ({counts[key]})
            </button>
          ))}
        </div>

        <select className="pc-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort plants">
          <option value="recent">Recently Added</option>
          <option value="name">Name A–Z</option>
          <option value="attention">Needs Attention First</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="pc-card pc-empty">
          {plants.length === 0
            ? 'No plants saved yet. Scan a leaf and save it to start your collection.'
            : 'No plants match your search or filter.'}
        </div>
      ) : (
        <div className="pc-grid pc-grid--3">
          {visible.map((plant) => (
            <PlantCard key={plant.id} plant={plant} showSpecies onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyPlants;
