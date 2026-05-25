import { API_TIMEOUT } from './constants';

const VITE_API_URL = import.meta.env.VITE_API_URL;

const controllers = new WeakMap();

function getAbortSignal(timeout = API_TIMEOUT) {
  const controller = new AbortController();
  controllers.set(controller, setTimeout(() => controller.abort(), timeout));
  return controller.signal;
}

function clearTimeoutFor(controller) {
  const t = controllers.get(controller);
  if (t) clearTimeout(t);
}

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const signal = getAbortSignal(options.timeout);
  const controller = signal.controller || { abort: () => {} };

  try {
    const res = await fetch(VITE_API_URL + path, {
      ...options,
      headers,
      credentials: 'include',
      signal
    });

    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = { success: false, error: 'Unexpected response from server' };
    }

    if (!res.ok || (data && data.success === false)) {
      const error = new Error(data.error || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw err;
  }
}

export function get(path, options) {
  return apiFetch(path, { method: 'GET', ...options });
}

export function post(path, body, options) {
  return apiFetch(path, { method: 'POST', body: JSON.stringify(body), ...options });
}

export function put(path, body, options) {
  return apiFetch(path, { method: 'PUT', body: JSON.stringify(body), ...options });
}

export function del(path, options) {
  return apiFetch(path, { method: 'DELETE', ...options });
}
