import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true, // sends/receives the session cookie
});

// Read the CSRF token Django set in a cookie, and attach it to every
// unsafe request (POST/PUT/PATCH/DELETE), as Django requires.
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

api.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

export default api;
