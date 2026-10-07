import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

function Dashboard() {
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    api.get('/plants/').then((res) => setPlants(res.data));
  }, []);

  return (
    <div className="container py-5">
      <h3>Your Plants</h3>
      <Link to="/upload" className="btn btn-success mb-4">+ Scan a New Plant</Link>

      <div className="row">
        {plants.length === 0 && <p>No plants yet — scan your first one!</p>}
        {plants.map((plant) => {
          const latest = plant.history[0];
          return (
            <div className="col-md-4 mb-3" key={plant.id}>
              <div className="card p-3">
                <h5>{plant.nickname || plant.species_name}</h5>
                <p className="text-muted mb-1">{plant.species_name}</p>
                {latest && (
                  <span className={`badge bg-secondary mb-2`}>{latest.severity}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
