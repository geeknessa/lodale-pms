import { safeGetItem } from '../utils/safeStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Custom REST API Client for communicating with the local Express Backend
 */
export async function apiClient(endpoint, options = {}) {
  const token = safeGetItem('session', 'lodale_token') || safeGetItem('local', 'lodale_token') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('lodale_token') : null) || (typeof localStorage !== 'undefined' ? localStorage.getItem('lodale_token') : null);

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    // Don't set Content-Type for FormData — the browser sets it with the correct boundary
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  // Only JSON-stringify plain objects, not FormData
  if (options.body && typeof options.body === 'object' && !isFormData) {
    config.body = JSON.stringify(options.body);
  }

  // Safety timeout (default 15s) to prevent requests from hanging indefinitely
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 15000);
  const signal = options.signal || controller.signal;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...config,
      signal
    });
  } catch (fetchErr) {
    if (fetchErr.name === 'AbortError') {
      throw new Error("Request timed out. Please check your internet connection or server status.");
    }
    throw fetchErr;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = errorData.error || errorData.message;

    if (response.status === 429) {
      errorMessage = errorMessage || "Too many requests. Please wait a moment and try again.";
    }

    // Fall back to friendly status messages only when backend did not provide a message
    if (!errorMessage || typeof errorMessage !== 'string' || !errorMessage.trim()) {
      if (response.status === 404) {
        errorMessage = "The requested information could not be found. Please check and try again.";
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = "You don't have permission to perform this action. Please log in and try again.";
      } else if (response.status >= 500) {
        errorMessage = "We're experiencing a temporary issue on our end. Please try again in a few moments.";
      } else {
        errorMessage = "Something went wrong. Please try again.";
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}
