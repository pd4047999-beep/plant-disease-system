export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const data = err.response?.data;

  // No response at all = the server is unreachable
  if (!data) {
    return err.request ? 'Cannot reach the server. Is the backend running?' : fallback;
  }
  if (typeof data === 'string') return fallback; // e.g. an HTML error page
  if (data.error) return data.error;
  if (data.detail) return data.detail;

  // Django REST Framework field errors look like { field: ["message", ...] }
  return Object.entries(data)
    .map(([field, msgs]) => `${field}: ${[].concat(msgs).join(' ')}`)
    .join(' | ');
}
