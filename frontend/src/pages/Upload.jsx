import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Trash2, UploadCloud } from 'lucide-react';
import api from '../api/axios';
import { getErrorMessage } from '../api/errors';
import { formatFileSize } from '../utils/format';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 5;
const SUPPORTED_PLANTS =
  'Apple, Bell Pepper, Blueberry, Cherry, Corn, Grape, Orange, Peach, Potato, Raspberry, Soybean, Squash, Strawberry and Tomato';

function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const plantId = location.state?.plantId; // set when coming from "Scan Again"

  // Free the temporary preview URL when it is replaced or the page closes.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const selectFile = (selected) => {
    setError('');
    if (!selected) return;
    if (!ALLOWED.includes(selected.type)) {
      setError('Please choose a JPG, PNG or WEBP image.');
      return;
    }
    if (selected.size > MAX_MB * 1024 * 1024) {
      setError(`Image must be ${MAX_MB} MB or smaller.`);
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    selectFile(e.dataTransfer.files[0]);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/detect/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate('/result', { state: { result: res.data, file, plantId } });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not analyze the image. Please try again.'));
      setLoading(false);
    }
  };

  let engineText = 'Upload a leaf photo and your preview will appear here.';
  if (file && !loading) engineText = 'Photo ready. Press the button to run the diagnosis.';
  if (loading) engineText = 'Running the plant-disease model on your photo...';

  return (
    <div className="pc-container pc-page">
      <h1 className="pc-page-title">Detect Plant Disease</h1>
      <p className="pc-page-sub">
        Upload a clear photo of your plant&apos;s leaf. Our image-classification model will analyze it in seconds.
      </p>

      <div className="pc-detect">
        <div className="pc-card">
          {plantId && (
            <div className="pc-alert pc-alert--info">
              This scan will be added to your existing plant&apos;s history.
            </div>
          )}
          {error && <div className="pc-alert pc-alert--error">{error}</div>}

          <label
            className={`pc-dropzone${dragging ? ' pc-dropzone--active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <span className="pc-dropzone__icon"><UploadCloud size={30} /></span>
            <strong>Drag &amp; drop your leaf image here</strong>
            <span className="pc-browse">or <b>browse your files</b></span>
            <small>Supports PNG, JPG and WEBP up to {MAX_MB} MB</small>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => selectFile(e.target.files[0])}
            />
          </label>

          {file && (
            <div className="pc-filerow">
              <img src={preview} alt="Selected leaf thumbnail" />
              <div className="pc-filerow__info">
                <strong>{file.name}</strong>
                <span className="pc-muted pc-small">{formatFileSize(file.size)} • Ready to analyze</span>
              </div>
              <button className="pc-iconbtn" onClick={reset} disabled={loading} aria-label="Remove image">
                <Trash2 size={17} />
              </button>
            </div>
          )}

          <button
            className="pc-btn pc-btn--primary pc-btn--block"
            style={{ marginTop: 20, padding: '15px 22px' }}
            onClick={handleAnalyze}
            disabled={!file || loading}
          >
            {loading ? (<><span className="pc-spinner pc-spinner--sm" /> Analyzing...</>) : 'Diagnose Leaf Health Now'}
          </button>
        </div>

        <div className="pc-card pc-engine">
          <h3>AI Diagnostic Engine</h3>
          <p className="pc-engine__sub">{engineText}</p>

          <div className="pc-engine__view">
            {preview ? (
              <>
                <img src={preview} alt="Leaf preview" />
                {loading && (
                  <>
                    <span className="pc-engine__tag">ANALYZING</span>
                    <span className="pc-scanline" />
                  </>
                )}
              </>
            ) : (
              <span>Your photo preview will appear here</span>
            )}
          </div>

          {loading && (
            <div className="pc-engine__progress">
              <div className="pc-engine__progress-label"><span>Running diagnostics</span></div>
              <div className="pc-progress pc-progress--indeterminate"><div className="pc-progress__bar" /></div>
            </div>
          )}

          <p className="pc-engine__note">
            Supported plants: {SUPPORTED_PLANTS}. Use a clear, well-lit photo of a single leaf for the best results.
          </p>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
