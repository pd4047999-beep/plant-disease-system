
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import SeverityBadge from '../components/SeverityBadge';

function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plant, setPlant] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [notFound, setNotFound] = useState(false);

  const loadPlant = () => {
    api.get(`/plants/${id}/`)
      .then((res) => {
        setPlant(res.data);
        setNotFound(false);
      })
      .catch(() => {
        setNotFound(true);
      });
  };

  useEffect(() => {
    setPlant(null);
    setNotFound(false);
    loadPlant();
  }, [id]);

  // Show message if the plant ID does not exist
  if (notFound) {
    return (
      <p className="container py-4">
        Plant not found.
      </p>
    );
  }

  // Show loading while plant data is being fetched
  if (!plant) {
    return (
      <p className="container py-4">
        Loading...
      </p>
    );
  }

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setNoteDraft(entry.note || '');
  };

  const saveNote = async (entryId) => {
    try {
      await api.patch(`/care-history/${entryId}/`, {
        note: noteDraft
      });

      setEditingId(null);
      loadPlant();
    } catch (error) {
      alert('Could not save the note. Please try again.');
    }
  };

  const deleteEntry = async (entryId) => {
    if (!window.confirm('Delete this history entry?')) {
      return;
    }

    try {
      await api.delete(`/care-history/${entryId}/`);
      loadPlant();
    } catch (error) {
      alert('Could not delete this history entry.');
    }
  };

  const scanAgain = () => {
    // Link the next scan to this existing plant
    navigate('/upload', {
      state: { plantId: plant.id }
    });
  };

  return (
    <div className="container py-4">

      {/* Plant heading */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>{plant.nickname || plant.species_name}</h3>

        <button
          className="btn btn-success"
          onClick={scanAgain}
        >
          Scan Again
        </button>
      </div>

      {/* Plant history */}
      <div className="border-start border-3 ps-4">

        {plant.history.length === 0 && (
          <p>No scans yet for this plant.</p>
        )}

        {plant.history.map((entry) => (
          <div className="card mb-3 p-3" key={entry.id}>

            <div className="d-flex gap-3">

              <img
                src={entry.image}
                alt="Plant scan"
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'cover'
                }}
                className="rounded"
              />

              <div className="flex-grow-1">

                {/* Detection result */}
                <div className="d-flex justify-content-between align-items-center">
                  <strong>{entry.detected_condition}</strong>

                  <SeverityBadge severity={entry.severity} />
                </div>

                <small className="text-muted">
                  {new Date(entry.created_at).toLocaleString()}
                </small>

                <p className="mb-1 mt-1">
                  {entry.recommendation}
                </p>

                {/* Edit note section */}
                {editingId === entry.id ? (
                  <div className="d-flex gap-2">

                    <input
                      className="form-control form-control-sm"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Write a note..."
                    />

                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => saveNote(entry.id)}
                    >
                      Save
                    </button>

                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>

                  </div>
                ) : (
                  <div className="d-flex justify-content-between align-items-center">

                    <span className="text-muted fst-italic">
                      {entry.note || 'No note'}
                    </span>

                    <div>
                      <button
                        className="btn btn-sm btn-link"
                        onClick={() => startEdit(entry)}
                      >
                        ✎ Edit note
                      </button>

                      <button
                        className="btn btn-sm btn-link text-danger"
                        onClick={() => deleteEntry(entry.id)}
                      >
                        Delete
                      </button>
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
