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
  },

  async deactivateMyAccount(reason = '') {
    return await apiClient('/users/me/deactivate', {
      method: 'POST',
      body: { reason },
    });
  },

  async payRestorationFee(paymentReference = '') {
    return await apiClient('/users/me/pay-restoration-fee', {
      method: 'POST',
      body: { paymentReference },
    });
  },

  async changePassword(currentPassword, newPassword) {
    return await apiClient('/users/me/change-password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
    });
  },

  async requestEmailChange(newEmail) {
    return await apiClient('/users/me/request-email-change', {
      method: 'POST',
      body: { newEmail },
    });
  },

  async verifyEmailChange(newEmail, code) {
    return await apiClient('/users/me/verify-email-change', {
      method: 'POST',
      body: { newEmail, code },
    });
  }
};
