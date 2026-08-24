import { apiClient } from '../lib/apiClient';

export const applicationService = {
  /**
   * Submit a new application for a property.
   * @param {string} propertyId - The UUID of the property.
   * @param {string|object} [notesOrData] - Optional message or full application payload.
   */
  async apply(propertyId, notesOrData = '') {
    const payload = typeof notesOrData === 'object'
      ? { propertyId, ...notesOrData }
      : { propertyId, notes: notesOrData };

    return await apiClient('/applications', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Get all applications for the currently logged-in tenant.
   */
  async getMyApplications() {
    const data = await apiClient('/applications/me');
    return data.applications || [];
  },

  /**
   * Check if the current tenant has already applied for a specific property.
   * Returns the existing application object, or null if not found.
   * @param {string} propertyId
   */
  async getApplicationForProperty(propertyId) {
    try {
      const apps = await applicationService.getMyApplications();
      return apps.find(app => String(app.propertyId) === String(propertyId)) || null;
    } catch {
      return null;
    }
  },

  /**
   * Get all applications for the logged-in landlord.
   */
  async getLandlordApplications() {
    const data = await apiClient('/applications/landlord');
    return data.applications || [];
  },

  /**
   * Update the status of an application (Landlord only).
   */
  async updateStatus(applicationId, status, rejectionReason = '') {
    const data = await apiClient(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: { status, rejectionReason },
    });
    return data.application;
  },
};
