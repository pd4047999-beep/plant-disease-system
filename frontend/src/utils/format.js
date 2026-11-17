export const SEVERITY_LABEL = {
  healthy: 'Healthy',
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
};

// Lower number = needs attention sooner
export const SEVERITY_RANK = { severe: 0, moderate: 1, mild: 2, healthy: 3 };

export function timeAgo(dateString) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString([], {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Turn a recommendation paragraph into one step per sentence.
export function splitSteps(text) {
  if (!text) return [];
  const parts = text.match(/[^.!?]+[.!?]+(\s|$)/g);
  return (parts || [text]).map((s) => s.trim()).filter(Boolean);
}

export function formatFileSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
