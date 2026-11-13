
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getErrorMessage } from '../api/errors';
import SeverityBadge from '../components/SeverityBadge';

function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  if (!state || !state.result) {
    return (
      <div className="container py-4">
        <p>No result to show. Please upload a leaf photo first.</p>
        <button
          className="btn btn-success"
          onClick={() => navigate('/upload')}
        >
          Go to Upload
        </button>
      </div>
    );
  }

  const { result, file, plantId } = state;

  // Handle low-confidence predictions
  if (result.uncertain) {
    return (
      <div className="container py-4" style={{ maxWidth: '640px' }}>
        <div className="card p-4">
          <h4>We're not sure about this one</h4>

          <p>
            The model's confidence is low ({result.confidence_score}%).
            This usually means the photo is unclear, isn't a leaf,
            or shows a plant the model wasn't trained on.
          </p>

          {result.alternatives?.length > 0 && (
            <>
              <p className="mb-1">Closest guesses:</p>

              <ul>
                {result.alternatives.map((a) => (
                  <li key={a.class_name}>
                    {a.label} ({a.confidence_score}%)
                  </li>
                ))}
              </ul>
            </>
          )}

          <button
            className="btn btn-success"
            onClick={() => navigate('/upload')}
          >
            Try Another Photo
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    setError('');

    try {
      let targetPlantId = plantId;

      if (!targetPlantId) {
        const plantRes = await api.post('/plants/', {
          species_name: result.species_name,
          nickname: nickname.trim(),
        });

        targetPlantId = plantRes.data.id;
      }

      const formData = new FormData();

      formData.append('plant', targetPlantId);
      formData.append('image', file);
      formData.append('detected_condition', result.detected_condition);
      formData.append('confidence_score', result.confidence_score);
      formData.append('severity', result.severity);
      formData.append('recommendation', result.recommendation);

      await api.post('/care-history/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSaved(true);
    } catch (err) {
      setError(
        getErrorMessage(err, 'Could not save this plant. Please try again.')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: '640px' }}>
      <div className="card p-4">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h3 className="mb-0">{result.species_name}</h3>
            <h5 className="text-muted">{result.detected_condition}</h5>
          </div>

          <SeverityBadge severity={result.severity} />
        </div>

        <div className="mt-3">
          <small>Confidence: {result.confidence_score}%</small>

          <div className="progress mb-3" style={{ height: '10px' }}>
            <div
              className="progress-bar bg-success"
              style={{ width: `${result.confidence_score}%` }}
            />
          </div>
        </div>

        <div
          className="border rounded p-3 mb-3"
          style={{ background: '#e8f5e9' }}
        >
          <strong>Recommended Care</strong>
          <p className="mb-0 mt-1">{result.recommendation}</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2">{error}</div>
        )}

        {!saved ? (
          <>
            {!plantId && (
              <input
                className="form-control mb-2"
                placeholder="Give this plant a nickname (optional)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            )}

            <div>
              <button
                className="btn btn-success me-2"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : plantId
                    ? 'Add to Plant History'
                    : 'Save to My Plants'}
              </button>

              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate('/upload')}
                disabled={saving}
              >
                Scan Another Leaf
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="alert alert-success">Saved!</div>

            <button
              className="btn btn-success"
              onClick={() => navigate('/my-plants')}
            >
              Go to My Plants
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ResultPage;
