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
   * Fetch all registered users
   */
  async getUsers() {
    try {
      return await apiClient('/admin/users');
    } catch (error) {
      console.warn('[AdminService] Failed to fetch users:', error.message);
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

  /**
   * Update registered user account status (active, suspended)
   */
  async updateUserStatus(userId, status) {
    return await apiClient(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  /**
   * Delete a registered user account
   */
  async deleteUser(userId) {
    return await apiClient(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Fetch all pending property deletion and suspension requests
   */
  async getPendingRequests() {
    try {
      const res = await apiClient('/admin/properties/requests');
      return res.requests || [];
    } catch (error) {
      console.warn('[AdminService] Failed to fetch pending property requests:', error.message);
      return [];
    }
  },

  /**
   * Action property deletion request
   */
  async approveDeletion(propertyId) {
    return await apiClient(`/admin/properties/${propertyId}/approve-deletion`, { method: 'POST' });
  },

  async rejectDeletion(propertyId) {
    return await apiClient(`/admin/properties/${propertyId}/reject-deletion`, { method: 'POST' });
  },

  /**
   * Action property suspension request
   */
  async approveSuspension(propertyId) {
    return await apiClient(`/admin/properties/${propertyId}/approve-suspension`, { method: 'POST' });
  },

  async rejectSuspension(propertyId) {
    return await apiClient(`/admin/properties/${propertyId}/reject-suspension`, { method: 'POST' });
  },
};
