import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../api/axios';

function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);

  if (!state || !state.result) {
    return (
      <div className="container py-5">
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

  // Get result, uploaded file, and optional existing plant ID
  const { result, file, plantId } = state;

  const severityColor = {
    healthy: 'success',
    mild: 'warning',
    moderate: 'warning',
    severe: 'danger',
  }[result.severity] || 'secondary';

  const handleSave = async () => {
    try {
      // If scanning an existing plant, reuse its ID.
      // Otherwise, create a new plant.
      let targetPlantId = plantId;

      if (!targetPlantId) {
        const plantRes = await api.post('/plants/', {
          species_name: result.species_name,
          nickname: nickname || '',
        });

        targetPlantId = plantRes.data.id;
      }

      // Create the CareHistory entry
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
      alert('Could not save this plant. Please try again.');
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '600px' }}>
      <div className="card p-4">
        <h3>{result.species_name}</h3>

        <h5 className="text-muted">
          {result.detected_condition}
        </h5>

        <p>Confidence: {result.confidence_score}%</p>

        <span className={`badge bg-${severityColor} mb-3`}>
          {result.severity.toUpperCase()}
        </span>

        <div className="bg-light border rounded p-3 mb-3">
          <strong>Recommended Care:</strong>
          <p className="mb-0">{result.recommendation}</p>
        </div>

        {!saved ? (
          <>
            {/* Only show nickname field when creating a NEW plant */}
            {!plantId && (
              <input
                className="form-control mb-2"
                placeholder="Give this plant a nickname (optional)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            )}

            <button
              className="btn btn-success me-2"
              onClick={handleSave}
            >
              Save to My Plants
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate('/upload')}
            >
              Scan Another Leaf
            </button>
          </>
        ) : (
          <>
            <div className="alert alert-success">
              Saved!
            </div>

            <button
              className="btn btn-success"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ResultPage;
