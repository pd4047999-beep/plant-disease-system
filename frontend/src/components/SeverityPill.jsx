import { SEVERITY_LABEL } from '../utils/format';

function SeverityPill({ severity }) {
  const known = Boolean(SEVERITY_LABEL[severity]);
  const key = known ? severity : 'unknown';
  const label = known ? SEVERITY_LABEL[severity] : 'Unknown';
  return <span className={`pc-pill pc-pill--${key}`}>{label.toUpperCase()}</span>;
}

export default SeverityPill;
