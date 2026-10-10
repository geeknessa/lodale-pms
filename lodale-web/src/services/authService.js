import { apiClient } from '../lib/apiClient';
import { safeSetItem, safeSetJSON, safeGetItem, safeRemoveItem } from '../utils/safeStorage';

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
      safeSetItem('session', 'lodale_token', data.token);
      safeSetJSON('session', 'lodale_user', data.user);
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
      safeSetItem('session', 'lodale_token', data.token);
      // Inline (base64) avatars are stripped before caching to stay under quota.
      safeSetJSON('session', 'lodale_user', data.user);
    }
    return data;
  },

  /**
   * Sign out user
   */
  async signOut() {
    safeRemoveItem('session', 'lodale_token');
    safeRemoveItem('session', 'lodale_user');
  },

  /**
   * Fetch current authenticated user
   */
  async getCurrentUser() {
    const token = safeGetItem('session', 'lodale_token');
    if (!token) return null;

    try {
      const data = await apiClient('/auth/me');
      return data.user;
    } catch {
      safeRemoveItem('session', 'lodale_token');
      safeRemoveItem('session', 'lodale_user');
      return null;
    }
  },
};
