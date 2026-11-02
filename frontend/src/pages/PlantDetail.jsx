import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plant, setPlant] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');

  const loadPlant = () => {
    api.get(`/plants/${id}/`).then((res) => setPlant(res.data));
  };

  useEffect(loadPlant, [id]);

  if (!plant) return <p className="container py-4">Loading...</p>;

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setNoteDraft(entry.note || '');
  };

  const saveNote = async (entryId) => {
    await api.patch(`/care-history/${entryId}/`, { note: noteDraft });
    setEditingId(null);
    loadPlant();
  };

  const deleteEntry = async (entryId) => {
    if (!window.confirm('Delete this history entry?')) return;
    await api.delete(`/care-history/${entryId}/`);
    loadPlant();
  };

  const scanAgain = () => {
    // Pre-link the next scan to this existing plant instead of creating a new one
    navigate('/upload', { state: { plantId: plant.id } });
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>{plant.nickname || plant.species_name}</h3>
        <button className="btn btn-success" onClick={scanAgain}>Scan Again</button>
      </div>

      <div className="border-start border-3 ps-4">
        {plant.history.length === 0 && <p>No scans yet for this plant.</p>}
        {plant.history.map((entry) => (
          <div className="card mb-3 p-3" key={entry.id}>
            <div className="d-flex gap-3">
              <img src={entry.image} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover' }} className="rounded" />
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between">
                  <strong>{entry.detected_condition}</strong>
                  <span className="badge bg-secondary">{entry.severity}</span>
                </div>
                <small className="text-muted">{new Date(entry.created_at).toLocaleString()}</small>
                <p className="mb-1 mt-1">{entry.recommendation}</p>

                {editingId === entry.id ? (
                  <div className="d-flex gap-2">
                    <input
                      className="form-control form-control-sm"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                    />
                    <button className="btn btn-sm btn-success" onClick={() => saveNote(entry.id)}>Save</button>
                  </div>
                ) : (
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted fst-italic">{entry.note || 'No note'}</span>
                    <div>
                      <button className="btn btn-sm btn-link" onClick={() => startEdit(entry)}>✎ Edit note</button>
                      <button className="btn btn-sm btn-link text-danger" onClick={() => deleteEntry(entry.id)}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlantDetail;
