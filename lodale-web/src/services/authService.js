import { apiClient } from '../lib/apiClient';

/**
 * Auth Service connecting React UI to the local Express backend server
 */
export const authService = {
  /**
   * Register a new user
   */
  async signUp(userData) {
    const data = await apiClient('/auth/register', {
      method: 'POST',
      body: userData,
    });

    if (data.token) {
      sessionStorage.setItem('lodale_token', data.token);
      sessionStorage.setItem('lodale_user', JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Login user
   */
  async signIn(credentials) {
    const data = await apiClient('/auth/login', {
      method: 'POST',
      body: credentials,
    });

    if (data.token) {
      sessionStorage.setItem('lodale_token', data.token);
      sessionStorage.setItem('lodale_user', JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Sign out user
   */
  async signOut() {
    sessionStorage.removeItem('lodale_token');
    sessionStorage.removeItem('lodale_user');
    localStorage.removeItem('lodale_token');
    localStorage.removeItem('lodale_user');
  },

  /**
   * Fetch current authenticated user
   */
  async getCurrentUser() {
    const token = sessionStorage.getItem('lodale_token') || localStorage.getItem('lodale_token');
    if (!token) return null;

    try {
      const data = await apiClient('/auth/me');
      return data.user;
    } catch {
      sessionStorage.removeItem('lodale_token');
      sessionStorage.removeItem('lodale_user');
      localStorage.removeItem('lodale_token');
      localStorage.removeItem('lodale_user');
      return null;
    }
  },
};
