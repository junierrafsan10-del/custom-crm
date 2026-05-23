const BASE_URL = import.meta.env.VITE_API_URL;

function getToken() {
  return localStorage.getItem('crm_token');
}

function authHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  return headers;
}

async function request(method, path, body) {
  const opts = { method, headers: authHeaders() };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(BASE_URL + path, opts);
  const data = await res.json();
  if (!res.ok || (data && data.success === false)) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export function get(path) {
  return request('GET', path);
}

export function post(path, body) {
  return request('POST', path, body);
}

export function put(path, body) {
  return request('PUT', path, body);
}

export function del(path) {
  return request('DELETE', path);
}
