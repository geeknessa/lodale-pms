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
      localStorage.setItem('lodale_token', data.token);
      localStorage.setItem('lodale_user', JSON.stringify(data.user));
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
      localStorage.setItem('lodale_token', data.token);
      localStorage.setItem('lodale_user', JSON.stringify(data.user));
    }
    return data;
  },

  /**
   * Sign out user
   */
  async signOut() {
    localStorage.removeItem('lodale_token');
    localStorage.removeItem('lodale_user');
  },

  /**
   * Fetch current authenticated user
   */
  async getCurrentUser() {
    const token = localStorage.getItem('lodale_token');
    if (!token) return null;

    try {
      const data = await apiClient('/auth/me');
      return data.user;
    } catch {
      localStorage.removeItem('lodale_token');
      localStorage.removeItem('lodale_user');
      return null;
    }
  },
};
