import { apiClient } from '../lib/apiClient';

/**
 * Admin Service for managing property approval workflows and moderation
 */
export const adminService = {
  /**
   * Fetch all property listings awaiting admin review
   */
  async getPendingProperties() {
    try {
      return await apiClient('/admin/properties/pending');
    } catch (error) {
      console.warn('[AdminService] Failed to fetch pending properties:', error.message);
      return [];
    }
  },

  /**
   * Execute admin review decision (approve, reject, request_info)
   */
  async reviewProperty(propertyId, action, notes = '') {
    return await apiClient(`/admin/properties/${propertyId}/review`, {
      method: 'POST',
      body: { action, reason: notes, notes },
    });
  },
};
