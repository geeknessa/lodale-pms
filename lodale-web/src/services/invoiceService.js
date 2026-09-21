import { apiClient } from '../lib/apiClient';

export const invoiceService = {
  /**
   * Fetch all invoices for the current user.
   */
  async getMyInvoices() {
    try {
      const data = await apiClient('/rent/invoices');
      return data || [];
    } catch (err) {
      console.error('API backend unavailable for fetching invoices:', err?.message);
      return [];
    }
  },

  /**
   * Create a custom manual digital rent invoice.
   */
  async createInvoice(payload) {
    try {
      // Map frontend payload to backend schema if necessary
      const body = {
        leaseId: payload.leaseId || payload.lease_id,
        amount: payload.grandTotal || payload.amount,
        dueDate: payload.dueDate,
        billingPeriodStart: payload.issueDate,
        billingPeriodEnd: payload.dueDate
      };

      const data = await apiClient('/rent/invoice', {
        method: 'POST',
        body
      });
      return data;
    } catch (err) {
      console.error('API backend unavailable for invoice creation:', err?.message);
      return null;
    }
  },

  /**
   * Fetch digital invoice linked to an application ID.
   * (Since rent_invoices are linked to leases, we first fetch invoices and match)
   */
  async getInvoiceByApplicationId(applicationId) {
    if (!applicationId) return null;
    try {
      const invoices = await this.getMyInvoices();
      // If the backend joins leases, we can filter by application_id
      // For now, this is a best-effort fallback if the API doesn't have a direct route
      return invoices.find(i => String(i.applicationId || i.application_id) === String(applicationId)) || null;
    } catch (err) {
      console.error("Failed to get invoice by application id", err);
      return null;
    }
  },

  /**
   * Submit payment proof & mark invoice as paid.
   */
  async submitPaymentProof(invoiceId, { paymentReference, paymentProofUrl, paymentMethod }) {
    if (!invoiceId) return null;
    try {
      const data = await apiClient(`/rent/pay/${invoiceId}`, {
        method: 'POST',
        body: { 
          paymentReference, 
          paymentProofUrl, 
          paymentMethod: paymentMethod || 'Bank Transfer' 
        }
      });
      return data?.payment || null;
    } catch (e) {
      console.error("Failed to submit payment proof", e);
      return null;
    }
  }
};
