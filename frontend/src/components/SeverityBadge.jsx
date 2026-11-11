const COLORS = {
  healthy: '#2e7d32',
  mild: '#f9a825',
  moderate: '#ef6c00',
  severe: '#c62828',
};

function SeverityBadge({ severity }) {
  const color = COLORS[severity] || '#6c757d';
  return (
    <span
      className="badge"
      style={{ backgroundColor: color, color: severity === 'mild' ? '#000' : '#fff' }}
    >
      {severity ? severity.toUpperCase() : 'UNKNOWN'}
    </span>
  );
}

export default SeverityBadge;
