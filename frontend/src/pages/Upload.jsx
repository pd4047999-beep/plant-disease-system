import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/detect/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Pass the result AND the original file to the Result page via navigation state
      navigate('/result', { state: { result: res.data, file } });
    } catch (err) {
      setError('Something went wrong analyzing the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '500px' }}>
      <h3 className="mb-4">Upload a Leaf Photo</h3>
      {error && <div className="alert alert-danger">{error}</div>}

      {!preview ? (
        <div className="border border-2 border-dashed rounded p-5 text-center">
          <p>Drag & drop a leaf photo here, or click to browse</p>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>
      ) : (
        <div className="text-center">
          <img src={preview} alt="preview" className="img-fluid rounded mb-3" style={{ maxHeight: '300px' }} />
          <br />
          <button className="btn btn-outline-secondary me-2" onClick={() => { setFile(null); setPreview(null); }}>
            Remove
          </button>
          <button className="btn btn-success" onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Leaf'}
          </button>
        </div>
      )}
    </div>
  );
}

export default UploadPage;
