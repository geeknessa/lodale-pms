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

  /**
   * Initialize Paystack split payment for an invoice.
   */
  async initializePaystackPayment(invoiceId) {
    const data = await apiClient(`/rent/paystack/initialize/${invoiceId}`, {
      method: 'POST',
    });
    return data;
  },

  /**
   * Verify Paystack payment by reference.
   */
  async verifyPaystackPayment(reference) {
    const data = await apiClient('/rent/paystack/verify', {
      method: 'POST',
      body: { reference },
    });
    return data;
  },

  /**
   * Fetch verified Nigerian banks list from Paystack
   */
  async getBanks() {
    try {
      const data = await apiClient('/rent/banks');
      return Array.isArray(data?.banks) ? data.banks : [];
    } catch (err) {
      console.warn('Failed to fetch banks list:', err?.message);
      return [];
    }
  },

  /**
   * Get all landlord receipts for confirmed rent payments.
   */
  async getLandlordReceipts() {
    const data = await apiClient('/rent/receipts');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Sign/stamp a receipt by landlord.
   */
  async signReceipt(paymentId, signatureName) {
    const data = await apiClient(`/rent/receipts/${paymentId}/sign`, {
      method: 'POST',
      body: { signatureName },
    });
    return data;
  },

  /**
   * Send receipt copy to tenant via in-app notification & email.
   */
  async sendReceipt(paymentId) {
    const data = await apiClient(`/rent/receipts/${paymentId}/send`, {
      method: 'POST',
    });
    return data;
  },
};


