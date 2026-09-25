import { apiClient } from '../lib/apiClient';

export const invoiceService = {
  /**
   * Fetch all invoices for the current user.
   */
  async getMyInvoices() {
    try {
      const data = await apiClient('/rent/invoices');
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('API backend error fetching invoices:', err?.message);
      return [];
    }
  },

  /**
   * Create a custom manual digital rent invoice.
   */
  async createInvoice(payload) {
    // Pass the full payload to backend
    const body = {
      ...payload,
      amount: payload.grandTotal || payload.amount,
      grandTotal: payload.grandTotal || payload.amount,
      subtotal: payload.subtotal,
      lodaleFee: payload.lodaleFee,
      dueDate: payload.dueDate,
      issueDate: payload.issueDate,
      applicationId: payload.applicationId || payload.application_id,
      propertyId: payload.propertyId || payload.property_id,
      tenantId: payload.tenantId || payload.tenant_id,
      landlordId: payload.landlordId || payload.landlord_id,
      leaseId: payload.leaseId || payload.lease_id,
      invoiceNumber: payload.invoiceNumber || payload.invoice_number,
      bankName: payload.bankName,
      bankAccountNumber: payload.bankAccountNumber,
      bankAccountName: payload.bankAccountName,
      items: payload.items,
      notes: payload.notes || payload.note
    };

    const data = await apiClient('/rent/invoice', {
      method: 'POST',
      body
    });
    return data;
  },

  /**
   * Fetch digital invoice linked to an application ID.
   */
  async getInvoiceByApplicationId(applicationId) {
    if (!applicationId) return null;
    try {
      // First attempt direct application invoice route
      const inv = await apiClient(`/rent/invoice/application/${applicationId}`);
      if (inv && (inv.id || inv.invoiceNumber)) {
        return inv;
      }
    } catch (err) {
      // If 404 or route error, fallback to searching list
    }

    try {
      const invoices = await this.getMyInvoices();
      return invoices.find(i => String(i.applicationId || i.application_id) === String(applicationId)) || null;
    } catch (err) {
      console.error("Failed to get invoice by application id:", err);
      return null;
    }
  },

  /**
   * Submit payment proof & mark invoice as payment submitted.
   */
  async submitPaymentProof(invoiceId, { paymentReference, paymentProofUrl, paymentMethod, applicationId }) {
    if (!invoiceId) throw new Error("Invoice ID is required to submit payment proof");
    const data = await apiClient(`/rent/pay/${invoiceId}`, {
      method: 'POST',
      body: { 
        paymentReference, 
        paymentProofUrl, 
        paymentMethod: paymentMethod || 'Bank Transfer',
        applicationId
      }
    });
    return data?.invoice || data?.payment || data;
  },

  /**
   * Landlord confirms/marks invoice as paid.
   */
  async markInvoiceAsPaid(invoiceId, notes = 'Verified by Landlord') {
    if (!invoiceId) throw new Error("Invoice ID is required to verify payment");
    const data = await apiClient(`/rent/pay/${invoiceId}`, {
      method: 'POST',
      body: { 
        paymentMethod: 'Verified by Landlord',
        notes: notes || 'Verified by Landlord'
      }
    });
    return data?.invoice || data?.payment || data;
  }
};
