import { apiClient } from '../lib/apiClient';

export const leaseService = {
  /**
   * Generate a new lease agreement.
   * @param {object} payload - propertyId, tenantId, applicationId, startDate, endDate, rentAmount, rentPeriod, securityDeposit, customClauses, includePets, includeSmoking, includeLateFee
   */
  async generateLease(payload) {
    const data = await apiClient('/leases/generate', {
      method: 'POST',
      body: payload,
    });
    return data.lease;
  },

  /**
   * Sign a lease agreement.
   * @param {string} leaseId - The UUID of the lease.
   */
  async signLease(leaseId) {
    const data = await apiClient(`/leases/${leaseId}/sign`, {
      method: 'PATCH',
    });
    return data.lease;
  },

  /**
   * Get all leases for the currently logged-in user (tenant or landlord).
   */
  async getMyLeases() {
    const data = await apiClient('/leases/me');
    return data.leases || [];
  },

  /**
   * Get a specific lease by ID.
   * @param {string} leaseId
   */
  async getLeaseById(leaseId) {
    const data = await apiClient(`/leases/${leaseId}`);
    return data.lease;
  }
};
