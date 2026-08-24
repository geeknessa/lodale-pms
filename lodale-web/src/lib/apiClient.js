const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Custom REST API Client for communicating with the local Express Backend
 */
export async function apiClient(endpoint, options = {}) {
  const token = sessionStorage.getItem('lodale_token') || sessionStorage.getItem('lodale_token');

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = errorData.error || errorData.message;

    // Convert technical or missing errors into user-friendly messages
    const isTechnical = !errorMessage || 
      errorMessage.toLowerCase().includes('http error') || 
      errorMessage.toLowerCase().includes('server error') || 
      errorMessage.toLowerCase().includes('database') ||
      errorMessage.toLowerCase().includes('failed to fetch');

    if (response.status >= 500 || isTechnical) {
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
