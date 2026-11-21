import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getErrorMessage } from '../api/errors';
import SeverityPill from '../components/SeverityPill';
import { formatDateTime, splitSteps } from '../utils/format';

function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedPlantId, setSavedPlantId] = useState(null);
  const [error, setError] = useState('');
  const [diagnosedAt] = useState(() => new Date());

  const file = state?.file;
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!state || !state.result) {
    return (
      <div className="pc-container pc-page">
        <div className="pc-card pc-empty">
          <p>No result to show. Please upload a leaf photo first.</p>
          <button className="pc-btn pc-btn--primary" style={{ marginTop: 16 }} onClick={() => navigate('/upload')}>
            Go to Detect Disease
          </button>
        </div>
      </div>
    );
  }

  const { result, plantId } = state;
  const confidence = Math.max(0, Math.min(100, Number(result.confidence_score) || 0));

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
      setSavedPlantId(targetPlantId);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save this plant. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const imageCard = (
    <div className="pc-card pc-result__image">
      {previewUrl && <img src={previewUrl} alt="Scanned leaf" />}
      <div className="pc-result__meta">
        <div>Filename: <b>{file?.name}</b></div>
        <div>Diagnosed on: <b>{formatDateTime(diagnosedAt)}</b></div>
      </div>
    </div>
  );

  // Low-confidence answer: show the closest guesses instead of a diagnosis.
  if (result.uncertain) {
    return (
      <div className="pc-container pc-page">
        <div className="pc-result">
          {imageCard}
          <div className="pc-card">
            <h1 className="pc-result__title">We&apos;re not sure about this one</h1>
            <p style={{ marginTop: 20 }}>
              The model&apos;s confidence is low ({confidence}%). This usually means the photo is unclear,
              isn&apos;t a leaf, or shows a plant the model wasn&apos;t trained on.
            </p>

            {result.alternatives?.length > 0 && (
              <>
                <h3 className="pc-sub">Closest guesses</h3>
                <div className="pc-guess">
                  {result.alternatives.map((a) => (
                    <div key={a.class_name}>
                      <div className="pc-guess__row">
                        <span>{a.label}</span>
                        <span className="pc-muted">{a.confidence_score}%</span>
                      </div>
                      <div className="pc-progress">
                        <div className="pc-progress__bar" style={{ width: `${a.confidence_score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="pc-result__actions">
              <button className="pc-btn pc-btn--primary" onClick={() => navigate('/upload', { state: { plantId } })}>
                Try Another Photo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const healthy = result.severity === 'healthy';
  const steps = splitSteps(result.recommendation);

  return (
    <div className="pc-container pc-page">
      <div className="pc-result">
        {imageCard}

        <div className="pc-card">
          <div className="pc-result__pills">
            <span className="pc-pill pc-pill--species">{result.species_name.toUpperCase()}</span>
            <SeverityPill severity={result.severity} />
          </div>

          <h1 className="pc-result__title">
            {healthy ? 'No Disease Detected' : `${result.detected_condition} Detected`}
          </h1>

          <div className="pc-confidence">
            <div className="pc-confidence__row">
              <span>Engine Confidence Score</span>
              <strong>{confidence}%</strong>
            </div>
            <div className="pc-progress">
              <div className="pc-progress__bar" style={{ width: `${confidence}%` }} />
            </div>
          </div>

          <h3 className="pc-sub">Care Recommendations</h3>
          <div className="pc-steps">
            {steps.map((step, index) => (
              <div className="pc-step" key={index}>
                <span className="pc-step__num">{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <p className="pc-disclaimer">
            General guidance from an automated model. It is not a substitute for advice from a plant or agriculture expert.
          </p>

          {error && <div className="pc-alert pc-alert--error" style={{ marginTop: 20 }}>{error}</div>}

          {savedPlantId ? (
            <>
              <div className="pc-alert pc-alert--success" style={{ marginTop: 24 }}>
                Saved to your collection!
              </div>
              <div className="pc-result__actions" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
                <Link to={`/plants/${savedPlantId}`} className="pc-btn pc-btn--primary">View Plant History</Link>
                <Link to="/upload" className="pc-btn pc-btn--outline">Scan Another Leaf</Link>
              </div>
            </>
          ) : (
            <>
              {!plantId && (
                <input
                  className="pc-input"
                  style={{ marginTop: 24 }}
                  placeholder="Give this plant a nickname (optional)"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              )}
              <div className="pc-result__actions">
                <button className="pc-btn pc-btn--primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : plantId ? 'Add to Plant History' : 'Save to My Plants Collection'}
                </button>
                <button className="pc-btn pc-btn--outline" onClick={() => navigate('/upload')} disabled={saving}>
                  Scan Another Leaf
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultPage;
