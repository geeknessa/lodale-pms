import { apiClient } from '../lib/apiClient';
import { chatService } from './chatService';

export const leaseService = {
  /**
   * Generate a new lease agreement.
   * @param {object} payload - propertyId, tenantId, applicationId, startDate, endDate, rentAmount, rentPeriod, securityDeposit, customClauses, includePets, includeSmoking, includeLateFee
   */
  async generateLease(payload) {
    let lease = null;
    try {
      const data = await apiClient('/leases/generate', {
        method: 'POST',
        body: payload,
      });
      lease = data?.lease;
    } catch (err) {
      console.warn("Backend generate lease API unavailable, using local session store:", err);
    }

    if (!lease) {
      lease = {
        id: "lease-" + Date.now(),
        ...payload,
        status: "drafted",
        createdAt: new Date().toISOString()
      };
    }

    const appIdStr = String(payload.applicationId);

    // Persist generated lease into tenantLeases in localStorage
    const localLeases = JSON.parse(localStorage.getItem("tenantLeases") || "[]");
    const existingIdx = localLeases.findIndex(l => String(l.applicationId || l.application_id) === appIdStr);
    const leaseObj = {
      ...lease,
      applicationId: appIdStr,
      status: "drafted"
    };

    if (existingIdx >= 0) {
      localLeases[existingIdx] = leaseObj;
    } else {
      localLeases.push(leaseObj);
    }
    localStorage.setItem("tenantLeases", JSON.stringify(localLeases));

    // Update sentLeaseAppIds list
    const sentLeaseIds = JSON.parse(localStorage.getItem("sentLeaseAppIds") || "[]");
    if (!sentLeaseIds.includes(appIdStr)) {
      sentLeaseIds.push(appIdStr);
      localStorage.setItem("sentLeaseAppIds", JSON.stringify(sentLeaseIds));
    }

    // Send chat notification to tenant candidate
    const tenantId = payload.tenantId || payload.tenant_id;
    if (tenantId) {
      try {
        const msg = `[RESIDENTIAL LEASE AGREEMENT ISSUED]\nYour landlord has generated your official Residential Lease Agreement.\nStart Date: ${payload.startDate}\nEnd Date: ${payload.endDate}\nRent: ₦${Number(payload.rentAmount || 0).toLocaleString()} / ${payload.rentPeriod || 'year'}\n\nPlease visit your dashboard to review and submit your digital signature.`;
        await chatService.sendMessage(tenantId, msg, payload.propertyId);
      } catch (chatErr) {
        console.warn("Failed to send chat notification for lease generation:", chatErr);
      }
    }

    return leaseObj;
  },

  /**
   * Get lease agreement by application ID.
   * @param {string|number} applicationId
   */
  async getLeaseByApplicationId(applicationId) {
    if (!applicationId) return null;
    const appIdStr = String(applicationId);
    
    try {
      const leases = await this.getMyLeases();
      const match = (leases || []).find(l => String(l.applicationId || l.application_id) === appIdStr);
      if (match) return match;
    } catch (e) {
      console.warn("Backend getLeaseByApplicationId error, checking localStorage:", e);
    }

    const localLeases = JSON.parse(localStorage.getItem("tenantLeases") || "[]");
    return localLeases.find(l => String(l.applicationId || l.application_id) === appIdStr) || null;
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
      return data.lease;
    } catch (e) {
      console.warn("Backend signLease API error, using local fallback:", e);
      return { id: leaseId, status: "signed", signedByTenant: true };
    }
  },

  /**
   * Get all leases for the currently logged-in user (tenant or landlord).
   */
  async getMyLeases() {
    try {
      const data = await apiClient('/leases/me');
      return data.leases || [];
    } catch (e) {
      return JSON.parse(localStorage.getItem("tenantLeases") || "[]");
    }
  },

  /**
   * Get a specific lease by ID.
   * @param {string} leaseId
   */
  async getLeaseById(leaseId) {
    try {
      const data = await apiClient(`/leases/${leaseId}`);
      return data.lease;
    } catch (e) {
      const localLeases = JSON.parse(localStorage.getItem("tenantLeases") || "[]");
      return localLeases.find(l => String(l.id) === String(leaseId)) || null;
    }
  }
};

