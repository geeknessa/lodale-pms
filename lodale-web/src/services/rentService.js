import { apiClient } from '../lib/apiClient';

export const rentService = {
  /**
   * Get all invoices for the currently logged-in user.
   */
  async getMyInvoices() {
    const data = await apiClient('/rent/invoices');
    return data || [];
  },

  /**
   * Create a custom invoice (landlord only).
   */
  async createInvoice(payload) {
    const data = await apiClient('/rent/invoice', {
      method: 'POST',
      body: payload,
    });
    return data;
  },

  /**
   * Pay/record payment for an invoice.
   */
  async recordPayment(invoiceId, payload) {
    const data = await apiClient(`/rent/pay/${invoiceId}`, {
      method: 'POST',
      body: payload,
    });
    return data;
  },
};
