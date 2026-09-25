import { apiClient } from '../lib/apiClient';

export const maintenanceService = {
  /**
   * Submit a new maintenance request (tenant only).
   */
  async createRequest(payload) {
    const data = await apiClient('/maintenance', {
      method: 'POST',
      body: payload,
    });
    return data;
  },

  /**
   * Get all maintenance requests.
   */
  async getMyRequests() {
    const data = await apiClient('/maintenance');
    return data || [];
  },

  /**
   * Update the status of a maintenance request (landlord only).
   */
  async updateRequestStatus(id, payload) {
    const data = await apiClient(`/maintenance/${id}`, {
      method: 'PATCH',
      body: payload,
    });
    return data;
  },
};
