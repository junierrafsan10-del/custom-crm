const VITE_API_URL = import.meta.env.VITE_API_URL;

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('crm_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  const res = await fetch(VITE_API_URL + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok || (data && data.success === false)) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export function get(path) {
  return apiFetch(path, { method: 'GET' });
}

export function post(path, body) {
  return apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
}

export function put(path, body) {
  return apiFetch(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function del(path) {
  return apiFetch(path, { method: 'DELETE' });
}
