import { apiClient } from '../lib/apiClient';

export const leaseService = {
  /**
   * Generate a new lease agreement.
   * @param {object} payload - propertyId, tenantId, applicationId, startDate, endDate, rentAmount, rentPeriod, securityDeposit, customClauses, includePets, includeSmoking, includeLateFee
   */
  async generateLease(payload) {
    try {
      const data = await apiClient('/leases/generate', {
        method: 'POST',
        body: payload,
      });
      return data?.lease || null;
    } catch (err) {
      console.error("Backend generate lease error:", err);
      return null;
    }
  },

  /**
   * Get lease agreement by application ID.
   * (We fetch all leases and filter by applicationId. Alternatively, the backend could have a dedicated endpoint)
   * @param {string|number} applicationId
   */
  async getLeaseByApplicationId(applicationId) {
    if (!applicationId) return null;
    const appIdStr = String(applicationId);
    
    try {
      const leases = await this.getMyLeases();
      const match = (leases || []).find(l => String(l.applicationId || l.application_id) === appIdStr);
      return match || null;
    } catch (e) {
      console.error("Backend getLeaseByApplicationId error:", e);
      return null;
    }
  },

  /**
   * Sign a lease agreement.
   * @param {string} leaseId - The UUID of the lease.
   */
  async signLease(leaseId) {
    try {
      const data = await apiClient(`/leases/${leaseId}/sign`, {
        method: 'PATCH',
      });
      return data?.lease || null;
    } catch (e) {
      console.error("Backend signLease API error:", e);
      return null;
    }
  },

  /**
   * Get all leases for the currently logged-in user (tenant or landlord).
   */
  async getMyLeases() {
    try {
      const data = await apiClient('/leases/me');
      return data?.leases || [];
    } catch (e) {
      console.error("Backend getMyLeases API error:", e);
      return [];
    }
  },

  /**
   * End a lease agreement.
   * @param {string} leaseId - The UUID of the lease.
   */
  async endLease(leaseId) {
    try {
      const data = await apiClient(`/leases/${leaseId}`, {
        method: 'PATCH',
        body: { status: 'ended' }
      });
      return data?.lease || null;
    } catch (e) {
      console.error("Backend endLease API error:", e);
      throw e;
    }
  },

  /**
   * Get a specific lease by ID.
   * @param {string} leaseId
   */
  async getLeaseById(leaseId) {
    if (!leaseId) return null;
    try {
      const data = await apiClient(`/leases/${leaseId}`);
      return data?.lease || null;
    } catch (e) {
      console.error("Backend getLeaseById API error:", e);
      return null;
    }
  }
};
