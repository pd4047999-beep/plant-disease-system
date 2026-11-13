
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { getErrorMessage } from '../api/errors';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 5;

function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const plantId = location.state?.plantId;

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

      navigate('/result', {
        state: {
          result: res.data,
          file,
          plantId,
        },
      });
    } catch (err) {
      setError(
        getErrorMessage(err, 'Could not analyze the image. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(null);
    setPreview(null);
    setError('');
  };

  return (
    <div className="container py-4" style={{ maxWidth: '520px' }}>
      <h3 className="mb-4">Upload a Leaf Photo</h3>

      {/* Supported plants */}
      <p className="text-muted small">
        Supported plants: Apple, Bell Pepper, Blueberry, Cherry, Corn, Grape,
        Orange, Peach, Potato, Raspberry, Soybean, Squash, Strawberry and
        Tomato. Use a clear photo of a single leaf.
      </p>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {!preview ? (
        <label
          className={`d-block rounded p-5 text-center ${
            dragging ? 'bg-light' : ''
          }`}
          style={{
            border: `2px dashed ${
              dragging ? '#2e7d32' : '#adb5bd'
            }`,
            cursor: 'pointer',
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div style={{ fontSize: '2rem' }}>☁️</div>

          <p className="mb-1">
            Drag &amp; drop a leaf photo here, or click to browse
          </p>

          <small className="text-muted">
            JPG, PNG or WEBP, up to {MAX_MB} MB
          </small>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => selectFile(e.target.files[0])}
          />
        </label>
      ) : (
        <div className="text-center">
          <img
            src={preview}
            alt="Selected leaf"
            className="img-fluid rounded mb-3"
            style={{ maxHeight: '300px' }}
          />

          <div>
            <button
              className="btn btn-outline-secondary me-2"
              onClick={reset}
              disabled={loading}
            >
              Remove
            </button>

            <button
              className="btn btn-success"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Analyzing your leaf...
                </>
              ) : (
                'Analyze Leaf'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadPage;
