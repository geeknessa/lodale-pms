import { apiClient } from '../lib/apiClient';

export const userService = {
  /**
   * Get current authenticated user profile
   */
  async getProfile() {
    return await apiClient('/users/me');
  },

  /**
   * Update current user profile
   */
  async updateProfile(profileData) {
    return await apiClient('/users/me', {
      method: 'PUT',
      body: profileData,
    });
  }
};
