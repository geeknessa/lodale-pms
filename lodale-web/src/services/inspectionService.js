import { apiClient } from '../lib/apiClient';

export const inspectionService = {
  /**
   * Get inspection details for a specific application ID
   */
  async getInspection(appId) {
    if (!appId) return null;
    try {
      const all = await this.getAllInspections();
      const match = all.find(i => String(i.applicationId || i.application_id) === String(appId));
      return match || null;
    } catch (e) {
      console.error("Error fetching inspection data:", e);
      return null;
    }
  },

  /**
   * Save or schedule a new inspection for an application
   */
  async saveInspection(appId, data) {
    try {
      const existing = await this.getInspection(appId);
      
      if (existing) {
        // Update existing
        const res = await apiClient(`/inspections/${existing.id}`, {
          method: 'PATCH',
          body: {
            date: data.date,
            time: data.time,
            notes: data.notes,
            status: data.status,
            location: data.location
          }
        });
        return res?.inspection || null;
      } else {
        // Create new
        const res = await apiClient('/inspections', {
          method: 'POST',
          body: {
            applicationId: appId,
            propertyId: data.propertyId,
            tenantId: data.tenantId,
            date: data.date,
            time: data.time,
            location: data.location,
            notes: data.notes,
            status: data.status
          }
        });
        return res?.inspection || null;
      }
    } catch (e) {
      console.error("Error saving inspection data:", e);
      return null;
    }
  },

  /**
   * Update the status or fields of an existing inspection
   */
  async updateInspectionStatus(appId, status, extraFields = {}) {
    try {
      const existing = await this.getInspection(appId);
      if (!existing) return null;
      
      const res = await apiClient(`/inspections/${existing.id}`, {
        method: 'PATCH',
        body: {
          status,
          ...extraFields
        }
      });
      return res?.inspection || null;
    } catch (e) {
      console.error("Error updating inspection status:", e);
      return null;
    }
  },

  /**
   * Get all inspections across all applications (for calendar display)
   */
  async getAllInspections() {
    try {
      const data = await apiClient('/inspections');
      return data || [];
    } catch (e) {
      console.error("Error fetching all inspections:", e);
      return [];
    }
  }
};
