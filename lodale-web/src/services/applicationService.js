import { apiClient } from '../lib/apiClient';

export const applicationService = {
  /**
   * Submit a new application for a property.
   * @param {string} propertyId - The UUID of the property.
   * @param {string} [notes] - Optional message from tenant to landlord.
   */
  async apply(propertyId, notes = '') {
    return await apiClient('/applications', {
      method: 'POST',
      body: { propertyId, notes },
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
};
