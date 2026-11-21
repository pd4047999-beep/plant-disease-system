import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import api from '../api/axios';
import { getErrorMessage } from '../api/errors';
import SeverityPill from '../components/SeverityPill';
import { formatDateTime } from '../utils/format';

function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plant, setPlant] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');

  const loadPlant = () => {
    api.get(`/plants/${id}/`)
      .then((res) => setPlant(res.data))
      .catch(() => setNotFound(true));
  };

  useEffect(loadPlant, [id]);

  if (notFound) {
    return (
      <div className="pc-container pc-page">
        <div className="pc-card pc-empty">
          <p>Plant not found.</p>
          <Link to="/my-plants" className="pc-btn pc-btn--primary" style={{ marginTop: 16 }}>Back to My Plants</Link>
        </div>
      </div>
    );
  }

  if (!plant) {
    return <div className="pc-loading"><div className="pc-spinner" /></div>;
  }

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setNoteDraft(entry.note || '');
  };

  const saveNote = async (entryId) => {
    setError('');
    try {
      await api.patch(`/care-history/${entryId}/`, { note: noteDraft });
      setEditingId(null);
      loadPlant();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save the note.'));
    }
  };

  const deleteEntry = async (entryId) => {
    if (!window.confirm('Delete this history entry?')) return;
    setError('');
    try {
      await api.delete(`/care-history/${entryId}/`);
      loadPlant();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete the entry.'));
    }
  };

  // Pre-link the next scan to this existing plant instead of creating a new one
  const scanAgain = () => navigate('/upload', { state: { plantId: plant.id } });

  return (
    <div className="pc-container pc-page">
      <Link to="/my-plants" className="pc-back"><ArrowLeft size={16} /> My Plants</Link>

      <div className="pc-plant-head">
        <div>
          <h1>{plant.nickname || plant.species_name}</h1>
          {plant.nickname && <p className="pc-page-sub">{plant.species_name}</p>}
        </div>
        <button className="pc-btn pc-btn--primary" onClick={scanAgain}>
          <Camera size={18} /> Scan Again
        </button>
      </div>

      {error && <div className="pc-alert pc-alert--error">{error}</div>}

      {plant.history.length === 0 ? (
        <div className="pc-card pc-empty">No scans yet for this plant.</div>
      ) : (
        <div className="pc-timeline">
          {plant.history.map((entry) => (
            <div className="pc-timeline__item" key={entry.id}>
              <div className="pc-card pc-entry">
                <img src={entry.image} alt={`Scan from ${formatDateTime(entry.created_at)}`} />
                <div className="pc-entry__body">
                  <div className="pc-entry__top">
                    <h3>{entry.detected_condition}</h3>
                    <SeverityPill severity={entry.severity} />
                  </div>
                  <p className="pc-entry__date">
                    {formatDateTime(entry.created_at)} • Confidence {entry.confidence_score}%
                  </p>
                  <p className="pc-entry__rec">{entry.recommendation}</p>

                  {editingId === entry.id ? (
                    <div className="pc-entry__edit">
                      <input
                        className="pc-input"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add a note"
                      />
                      <button className="pc-btn pc-btn--primary" onClick={() => saveNote(entry.id)}>Save</button>
                      <button className="pc-btn pc-btn--outline" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="pc-entry__note">
                      <em>{entry.note || 'No note'}</em>
                      <div className="pc-actions">
                        <button className="pc-linkbtn" onClick={() => startEdit(entry)}>Edit note</button>
                        <button className="pc-linkbtn pc-linkbtn--danger" onClick={() => deleteEntry(entry.id)}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PlantDetail;
