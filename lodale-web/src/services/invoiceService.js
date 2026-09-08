import { apiClient } from '../lib/apiClient';

const INVOICE_STORAGE_KEY = 'lodale_digital_invoices';

function getStoredInvoices() {
  try {
    const raw = localStorage.getItem(INVOICE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveStoredInvoices(invoices) {
  try {
    localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoices));
  } catch (e) {
    console.error('Failed to save invoices to localStorage:', e);
  }
}

export const invoiceService = {
  /**
   * Create & store a digital rent invoice.
   */
  async createInvoice(payload) {
    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
    const newInvoice = {
      id: invoiceId,
      invoiceNumber: payload.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      applicationId: payload.applicationId,
      propertyId: payload.propertyId,
      tenantId: payload.tenantId,
      landlordId: payload.landlordId,
      issueDate: payload.issueDate || new Date().toISOString().split('T')[0],
      dueDate: payload.dueDate,
      
      // Identity info
      landlordName: payload.landlordName || 'Landlord',
      landlordAddress: payload.landlordAddress || '',
      landlordPhone: payload.landlordPhone || '',
      landlordEmail: payload.landlordEmail || '',
      
      tenantName: payload.tenantName || 'Tenant',
      tenantAddress: payload.tenantAddress || '',
      tenantPhone: payload.tenantPhone || '',
      tenantEmail: payload.tenantEmail || '',
      
      // Items & Amounts
      items: payload.items || [], // Array of { description, period, unitPrice, quantity, amount }
      subtotal: payload.subtotal || 0,
      lodaleFee: payload.lodaleFee || Math.round((payload.subtotal || 0) * 0.01),
      grandTotal: payload.grandTotal || 0,
      
      // Payment details
      paymentMethod: 'Bank Transfer',
      bankName: payload.bankName || '',
      bankAccountNumber: payload.bankAccountNumber || '',
      bankAccountName: payload.bankAccountName || '',
      note: payload.note || 'Direct Bank Transfer required prior to lease agreement execution.',
      
      // Status & Proof
      status: 'pending', // 'pending' | 'paid'
      paymentReference: '',
      paymentProofUrl: '',
      paidAt: null,
      createdAt: new Date().toISOString()
    };

    try {
      const data = await apiClient('/invoices', {
        method: 'POST',
        body: newInvoice
      });
      if (data && data.invoice) {
        const list = getStoredInvoices();
        const filtered = list.filter(i => i.applicationId !== payload.applicationId);
        saveStoredInvoices([...filtered, data.invoice]);
        return data.invoice;
      }
    } catch (err) {
      console.warn('API backend unavailable for invoice creation. Using local storage fallback:', err?.message);
    }

    const list = getStoredInvoices();
    const filtered = list.filter(i => i.applicationId !== payload.applicationId);
    const updated = [...filtered, newInvoice];
    saveStoredInvoices(updated);
    return newInvoice;
  },

  /**
   * Fetch digital invoice linked to an application ID.
   */
  async getInvoiceByApplicationId(applicationId) {
    if (!applicationId) return null;
    try {
      const data = await apiClient(`/invoices/application/${applicationId}`);
      if (data && data.invoice) return data.invoice;
    } catch (err) {
      // fallback
    }

    const list = getStoredInvoices();
    return list.find(i => String(i.applicationId) === String(applicationId)) || null;
  },

  /**
   * Submit payment proof & mark invoice as paid.
   */
  async submitPaymentProof(applicationId, { paymentReference, paymentProofUrl }) {
    const list = getStoredInvoices();
    const idx = list.findIndex(i => String(i.applicationId) === String(applicationId));

    if (idx !== -1) {
      list[idx].status = 'paid';
      list[idx].paymentReference = paymentReference;
      list[idx].paymentProofUrl = paymentProofUrl || '';
      list[idx].paidAt = new Date().toISOString();
      saveStoredInvoices(list);
      
      try {
        await apiClient(`/invoices/${list[idx].id}/pay`, {
          method: 'PATCH',
          body: { paymentReference, paymentProofUrl }
        });
      } catch (e) {}

      return list[idx];
    }
    return null;
  }
};
