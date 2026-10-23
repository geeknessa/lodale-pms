import crypto from 'crypto';
import { pool } from '../db/db.js';
import { paystackService, PLATFORM_FEE_PERCENT } from '../services/paystackService.js';
import { ProfileModel } from '../models/profileModel.js';
import { sendReceiptEmail, isEmailEnabled } from '../services/emailService.js';

function safeFormatDate(d) {
  if (!d) return '';
  try {
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return String(d);
    return parsed.toISOString().split('T')[0];
  } catch (e) {
    return String(d || '');
  }
}

// Helper to normalize invoice status: treat null/empty as 'unpaid'
export function normalizeInvoiceStatus(status) {
  const s = (status || '').trim().toLowerCase();
  return s || 'unpaid';
}

// Helper to format invoice database row to consistent response
function formatInvoiceRow(ri) {
  if (!ri) return null;
  let parsedItems = [];
  if (Array.isArray(ri.items)) {
    parsedItems = ri.items;
  } else if (typeof ri.items === 'string') {
    try {
      parsedItems = JSON.parse(ri.items);
    } catch (e) {
      parsedItems = [];
    }
  }

  return {
    ...ri,
    id: ri.id,
    invoiceNumber: ri.invoice_number || `INV-${String(ri.id).slice(0, 8).toUpperCase()}`,
    invoice_number: ri.invoice_number || `INV-${String(ri.id).slice(0, 8).toUpperCase()}`,
    applicationId: ri.application_id,
    application_id: ri.application_id,
    propertyId: ri.property_id,
    property_id: ri.property_id,
    tenantId: ri.tenant_id,
    tenant_id: ri.tenant_id,
    landlordId: ri.landlord_id,
    landlord_id: ri.landlord_id,
    leaseId: ri.lease_id,
    lease_id: ri.lease_id,
    amount: Number(ri.amount || 0),
    subtotal: Number(ri.subtotal || ri.amount || 0),
    lodaleFee: Number(ri.lodale_fee || 0),
    grandTotal: Number(ri.grand_total || ri.amount || 0),
    dueDate: safeFormatDate(ri.due_date),
    due_date: ri.due_date,
    issueDate: safeFormatDate(ri.issue_date || ri.created_at),
    issue_date: ri.issue_date,
    bankName: ri.bank_name || '',
    bank_name: ri.bank_name || '',
    bankAccountNumber: ri.bank_account_number || '',
    bank_account_number: ri.bank_account_number || '',
    bankAccountName: ri.bank_account_name || '',
    bank_account_name: ri.bank_account_name || '',
    items: parsedItems,
    notes: ri.notes || '',
    paymentReference: ri.payment_reference || '',
    payment_reference: ri.payment_reference || '',
    paymentProofUrl: ri.payment_proof_url || '',
    payment_proof_url: ri.payment_proof_url || '',
    status: ri.status || 'unpaid',
    paidAt: ri.paid_at,
    paid_at: ri.paid_at,
    paymentDate: ri.payment_date || safeFormatDate(ri.paid_at),
    payment_date: ri.payment_date || safeFormatDate(ri.paid_at),
    paymentMethod: ri.payment_method || ri.bank_name || 'Bank Transfer',
    payment_method: ri.payment_method || ri.bank_name || 'Bank Transfer',
    propertyTitle: ri.property_title || '',
    property_title: ri.property_title || '',
    tenantName: ri.tenant_name || '',
    landlordName: ri.landlord_name || '',
    landlordEmail: ri.landlord_email || '',
    landlordPhone: ri.landlord_phone || '',
    landlordAddress: ri.landlord_address || '',
    tenantEmail: ri.tenant_email || '',
    tenantPhone: ri.tenant_phone || '',
    tenantAddress: ri.tenant_address || '',
    billingPeriodStart: safeFormatDate(ri.billing_period_start),
    billing_period_start: safeFormatDate(ri.billing_period_start),
    billingPeriodEnd: safeFormatDate(ri.billing_period_end),
    billing_period_end: safeFormatDate(ri.billing_period_end),
    periodStart: safeFormatDate(ri.billing_period_start),
    periodEnd: safeFormatDate(ri.billing_period_end),
    extendLeaseByMonths: ri.extend_lease_by_months ? Number(ri.extend_lease_by_months) : null,
    extend_lease_by_months: ri.extend_lease_by_months ? Number(ri.extend_lease_by_months) : null,
    metadata: ri.metadata && typeof ri.metadata === 'object' ? ri.metadata : {}
  };
}

// Shared helper to calculate the expected/payable invoice amount
export function getExpectedInvoiceAmount(invoice) {
  if (!invoice) return 0;
  return Number(invoice.subtotal || invoice.grand_total || invoice.grandTotal || invoice.amount || 0);
}

// Helper to safely extend lease end_date if payment is for a lease renewal
async function applyLeaseRenewalIfApplicable(client, invoice) {
  if (!invoice.lease_id) return;

  try {
    const leaseRes = await client.query(
      'SELECT id, start_date, end_date, status FROM leases WHERE id = $1',
      [invoice.lease_id]
    );
    if (leaseRes.rowCount === 0) return;
    const lease = leaseRes.rows[0];

    let newEndDate = null;
    const extendMonths = Number(invoice.extend_lease_by_months || 0);

    if (extendMonths > 0) {
      let baseDate;
      if (lease.end_date) {
        baseDate = new Date(lease.end_date);
      } else if (invoice.billing_period_start) {
        baseDate = new Date(invoice.billing_period_start);
      } else {
        baseDate = new Date();
      }

      if (!isNaN(baseDate.getTime())) {
        const d = baseDate.getDate();
        baseDate.setMonth(baseDate.getMonth() + extendMonths);
        // Correct for month rollover (e.g. Jan 31 -> Feb 28)
        if (baseDate.getDate() !== d) {
          baseDate.setDate(0);
        }
        newEndDate = baseDate.toISOString().split('T')[0];
      }
    } else if (invoice.billing_period_end) {
      const candidateEnd = new Date(invoice.billing_period_end);
      if (!isNaN(candidateEnd.getTime())) {
        const candidateStr = candidateEnd.toISOString().split('T')[0];
        const currentEndStr = lease.end_date ? new Date(lease.end_date).toISOString().split('T')[0] : '';
        if (!currentEndStr || candidateStr > currentEndStr) {
          newEndDate = candidateStr;
        }
      }
    }

    if (newEndDate) {
      const currentStatus = (lease.status || '').toLowerCase();
      const newStatus = (currentStatus === 'expired') ? 'active' : lease.status;
      await client.query(
        `UPDATE leases SET end_date = $1, status = $2, updated_at = NOW() WHERE id = $3`,
        [newEndDate, newStatus, lease.id]
      );
    }
  } catch (err) {
    console.error('[applyLeaseRenewalIfApplicable] Error extending lease:', err);
  }
}

// @desc    Get all invoices for current user (tenant or landlord)
// @route   GET /api/rent/invoices
export const getMyInvoices = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role || req.user.primary_role;

    let query = '';
    let params = [userId];

    if (role === 'landlord' || role === 'admin') {
      query = `
        SELECT ri.*, 
               COALESCE(rp.payment_date::text, ri.paid_at::text) as payment_date,
               COALESCE(rp.payment_method, ri.bank_name, 'Bank Transfer') as payment_method,
               COALESCE(ri.property_id, l.property_id) as property_id,
               COALESCE(ri.tenant_id, l.tenant_id) as tenant_id,
               COALESCE(ri.landlord_id, l.landlord_id) as landlord_id,
               p.title as property_title, 
               (COALESCE(p.address_line1, '') || ', ' || COALESCE(p.city, '') || ', ' || COALESCE(p.state, '')) as property_address,
               tu.first_name || ' ' || tu.last_name as tenant_name,
               tu.email as tenant_email,
               tu.phone_number as tenant_phone,
               lu.first_name || ' ' || lu.last_name as landlord_name,
               lu.email as landlord_email,
               lu.phone_number as landlord_phone
        FROM rent_invoices ri
        LEFT JOIN LATERAL (
          SELECT payment_date, payment_method
          FROM rent_payments
          WHERE invoice_id = ri.id
          ORDER BY created_at DESC
          LIMIT 1
        ) rp ON true
        LEFT JOIN leases l ON ri.lease_id = l.id
        LEFT JOIN properties p ON (ri.property_id = p.id OR l.property_id = p.id)
        LEFT JOIN users tu ON (ri.tenant_id = tu.id OR l.tenant_id = tu.id)
        LEFT JOIN users lu ON (ri.landlord_id = lu.id OR l.landlord_id = lu.id)
        WHERE ri.landlord_id = $1 OR l.landlord_id = $1
        ORDER BY ri.created_at DESC, ri.due_date DESC
      `;
    } else {
      query = `
        SELECT ri.*, 
               COALESCE(rp.payment_date::text, ri.paid_at::text) as payment_date,
               COALESCE(rp.payment_method, ri.bank_name, 'Bank Transfer') as payment_method,
               COALESCE(ri.property_id, l.property_id) as property_id,
               COALESCE(ri.tenant_id, l.tenant_id) as tenant_id,
               COALESCE(ri.landlord_id, l.landlord_id) as landlord_id,
               p.title as property_title, 
               (COALESCE(p.address_line1, '') || ', ' || COALESCE(p.city, '') || ', ' || COALESCE(p.state, '')) as property_address,
               lu.first_name || ' ' || lu.last_name as landlord_name,
               lu.email as landlord_email,
               lu.phone_number as landlord_phone,
               tu.first_name || ' ' || tu.last_name as tenant_name,
               tu.email as tenant_email,
               tu.phone_number as tenant_phone
        FROM rent_invoices ri
        LEFT JOIN LATERAL (
          SELECT payment_date, payment_method
          FROM rent_payments
          WHERE invoice_id = ri.id
          ORDER BY created_at DESC
          LIMIT 1
        ) rp ON true
        LEFT JOIN leases l ON ri.lease_id = l.id
        LEFT JOIN properties p ON (ri.property_id = p.id OR l.property_id = p.id)
        LEFT JOIN users lu ON (ri.landlord_id = lu.id OR l.landlord_id = lu.id)
        LEFT JOIN users tu ON (ri.tenant_id = tu.id OR l.tenant_id = tu.id)
        WHERE ri.tenant_id = $1 OR l.tenant_id = $1
        ORDER BY ri.created_at DESC, ri.due_date DESC
      `;
    }

    const { rows } = await pool.query(query, params);
    const formatted = rows.map(formatInvoiceRow);
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Server error fetching invoices' });
  }
};

// @desc    Get invoice specifically linked to an application ID
// @route   GET /api/rent/invoice/application/:applicationId
export const getInvoiceByApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;

    const query = `
      SELECT ri.*, 
             COALESCE(ri.property_id, a.property_id) as property_id,
             COALESCE(ri.tenant_id, a.tenant_id) as tenant_id,
             COALESCE(ri.landlord_id, p.landlord_id) as landlord_id,
             p.title as property_title, 
             (COALESCE(p.address_line1, '') || ', ' || COALESCE(p.city, '') || ', ' || COALESCE(p.state, '')) as property_address,
             tu.first_name || ' ' || tu.last_name as tenant_name,
             tu.email as tenant_email,
             tu.phone_number as tenant_phone,
             lu.first_name || ' ' || lu.last_name as landlord_name,
             lu.email as landlord_email,
             lu.phone_number as landlord_phone
      FROM rent_invoices ri
      JOIN property_applications a ON ri.application_id = a.id
      JOIN properties p ON a.property_id = p.id
      LEFT JOIN users tu ON ri.tenant_id = tu.id
      LEFT JOIN users lu ON ri.landlord_id = lu.id
      WHERE ri.application_id = $1
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [applicationId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found for this application' });
    }

    const inv = rows[0];
    // Authorization: User must be tenant, landlord or admin
    const role = req.user.role || req.user.primary_role;
    if (role !== 'admin' && inv.tenant_id !== userId && inv.landlord_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view this invoice' });
    }

    res.json(formatInvoiceRow(inv));
  } catch (error) {
    console.error('Error fetching application invoice:', error);
    res.status(500).json({ error: 'Server error fetching invoice' });
  }
};

// @desc    Get all invoices for a specific lease
// @route   GET /api/rent/invoices/lease/:leaseId
export const getInvoicesByLease = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const userId = req.user.id;
    const role = req.user.role || req.user.primary_role;

    const leaseRes = await pool.query(
      `SELECT l.*, p.title as property_title 
       FROM leases l 
       JOIN properties p ON l.property_id = p.id 
       WHERE l.id = $1`,
      [leaseId]
    );

    if (leaseRes.rowCount === 0) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    const lease = leaseRes.rows[0];
    if (role !== 'admin' && lease.tenant_id !== userId && lease.landlord_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view invoices for this lease' });
    }

    const { rows } = await pool.query(
      `SELECT ri.*, 
              COALESCE(rp.payment_date::text, ri.paid_at::text) as payment_date,
              COALESCE(rp.payment_method, ri.bank_name, 'Bank Transfer') as payment_method,
              p.title as property_title,
              tu.first_name || ' ' || tu.last_name as tenant_name,
              tu.email as tenant_email,
              tu.phone_number as tenant_phone,
              lu.first_name || ' ' || lu.last_name as landlord_name,
              lu.email as landlord_email,
              lu.phone_number as landlord_phone
       FROM rent_invoices ri
       LEFT JOIN LATERAL (
         SELECT payment_date, payment_method
         FROM rent_payments
         WHERE invoice_id = ri.id
         ORDER BY created_at DESC
         LIMIT 1
       ) rp ON true
       LEFT JOIN properties p ON ri.property_id = p.id
       LEFT JOIN users tu ON ri.tenant_id = tu.id
       LEFT JOIN users lu ON ri.landlord_id = lu.id
       WHERE ri.lease_id = $1
       ORDER BY ri.created_at DESC`,
      [leaseId]
    );

    res.json(rows.map(formatInvoiceRow));
  } catch (error) {
    console.error('Error fetching lease invoices:', error);
    res.status(500).json({ error: 'Server error fetching lease invoices' });
  }
};

// @desc    Create a custom invoice (landlord only) - supports pre-lease applications and post-lease
// @route   POST /api/rent/invoice
export const createInvoice = async (req, res) => {
  const client = await pool.connect();
  try {
    const landlordId = req.user.id;
    const {
      applicationId,
      leaseId,
      propertyId: reqPropertyId,
      tenantId: reqTenantId,
      invoiceNumber,
      amount,
      grandTotal,
      subtotal,
      lodaleFee,
      dueDate,
      issueDate,
      bankName,
      bankAccountNumber,
      bankAccountName,
      items,
      notes,
      note,
      periodStart,
      periodEnd,
      billingPeriodStart,
      billingPeriodEnd,
      extendLeaseByMonths,
      metadata
    } = req.body;

    // Commercial line items total (collection base)
    const itemsTotal = Array.isArray(items) && items.length > 0
      ? items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : null;
    const commercialTotal = Number(itemsTotal !== null ? itemsTotal : (subtotal || amount || grandTotal || 0));
    const invoiceSubtotal = commercialTotal;

    // Lodale platform fee (3.5% of collection base for accounting / Paystack split)
    const invoiceLodaleFee = Math.round(commercialTotal * (PLATFORM_FEE_PERCENT / 100));

    // The tenant only pays the commercial invoice total (rent + deposits/items) WITHOUT platform fee on top
    const totalPayable = commercialTotal;
    const invNotes = notes || note || '';

    if (isNaN(totalPayable) || totalPayable <= 0) {
      return res.status(400).json({ error: 'Invoice total payable must be greater than 0' });
    }

    if (dueDate) {
      const parsedDue = new Date(dueDate);
      if (isNaN(parsedDue.getTime())) {
        return res.status(400).json({ error: 'Invoice due date must be a valid date' });
      }
    }

    const invDueDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const invIssueDate = issueDate || new Date().toISOString().split('T')[0];

    let propertyId = reqPropertyId;
    let tenantId = reqTenantId;
    let propertyTitle = 'Property';

    await client.query('BEGIN');

    // Case 1: Pre-lease Application Invoice
    if (applicationId) {
      const appRes = await client.query(
        `SELECT a.id, a.property_id, a.tenant_id, a.status, p.landlord_id, p.title as property_title
         FROM property_applications a
         JOIN properties p ON a.property_id = p.id
         WHERE a.id = $1`,
        [applicationId]
      );

      if (appRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Application not found' });
      }

      const appData = appRes.rows[0];
      if (appData.landlord_id !== landlordId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Unauthorized: You are not the landlord of this property' });
      }

      propertyId = appData.property_id;
      tenantId = appData.tenant_id;
      propertyTitle = appData.property_title;

      // Prevent duplicate invoices: Check if an invoice already exists for this application
      const existingInv = await client.query(
        'SELECT * FROM rent_invoices WHERE application_id = $1',
        [applicationId]
      );

      let savedInvoice;
      if (existingInv.rowCount > 0) {
        const current = existingInv.rows[0];
        if (current.status === 'paid') {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'An invoice for this application has already been paid.' });
        }

        if (current.status === 'payment_submitted') {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: 'Cannot update invoice: Payment proof has already been submitted for this invoice.' });
        }

        const paymentsCheck = await client.query(
          'SELECT 1 FROM rent_payments WHERE invoice_id = $1 LIMIT 1',
          [current.id]
        );
        if (paymentsCheck.rowCount > 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: 'Cannot update invoice: Payments have already been recorded for this invoice.' });
        }

        // Update the existing invoice record
        const updateRes = await client.query(
          `UPDATE rent_invoices 
           SET invoice_number = COALESCE($1, invoice_number),
               amount = $2,
               subtotal = $3,
               lodale_fee = $4,
               grand_total = $5,
               due_date = $6,
               issue_date = $7,
               bank_name = $8,
               bank_account_number = $9,
               bank_account_name = $10,
               items = $11,
               notes = $12,
               updated_at = NOW()
           WHERE id = $13
           RETURNING *`,
          [
            invoiceNumber || current.invoice_number,
            totalPayable,
            invoiceSubtotal,
            invoiceLodaleFee,
            totalPayable,
            invDueDate,
            invIssueDate,
            bankName,
            bankAccountNumber,
            bankAccountName,
            JSON.stringify(items || []),
            invNotes,
            current.id
          ]
        );
        savedInvoice = updateRes.rows[0];
      } else {
        // Insert new rent invoice record
        const generatedNum = invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
        const insertRes = await client.query(
          `INSERT INTO rent_invoices (
             application_id, property_id, tenant_id, landlord_id,
             invoice_number, amount, subtotal, lodale_fee, grand_total,
             due_date, issue_date, status, bank_name, bank_account_number, bank_account_name,
             items, notes
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'unpaid', $12, $13, $14, $15, $16)
           RETURNING *`,
          [
            applicationId,
            propertyId,
            tenantId,
            landlordId,
            generatedNum,
            totalPayable,
            invoiceSubtotal,
            invoiceLodaleFee,
            totalPayable,
            invDueDate,
            invIssueDate,
            bankName,
            bankAccountNumber,
            bankAccountName,
            JSON.stringify(items || []),
            invNotes
          ]
        );
        savedInvoice = insertRes.rows[0];
      }

      // Transition application status to 'invoice_issued' and link invoice_id
      await client.query(
        "UPDATE property_applications SET status = 'invoice_issued', invoice_id = $1, updated_at = NOW() WHERE id = $2",
        [savedInvoice.id, applicationId]
      );

      // Create a real notification for the Tenant (avoid duplicate unread notifications)
      const notifCheck = await client.query(
        `SELECT id FROM notifications 
         WHERE user_id = $1 AND reference_type = 'invoice' AND reference_id = $2 AND is_read = false`,
        [tenantId, savedInvoice.id]
      );

      if (notifCheck.rowCount === 0) {
        await client.query(
          `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            tenantId,
            'Digital Rent Invoice Issued',
            `A rent invoice of ₦${Number(totalPayable).toLocaleString()} has been issued for "${propertyTitle}". Please view your invoice and complete payment.`,
            'payment',
            'invoice',
            savedInvoice.id
          ]
        );
      }

      await client.query('COMMIT');
      return res.status(201).json(formatInvoiceRow(savedInvoice));
    }

    // Case 2: Lease-based Invoice (for renewals / ongoing rent)
    if (leaseId) {
      const leaseCheck = await client.query(
        `SELECT l.id, l.property_id, l.tenant_id, l.landlord_id, l.application_id,
                l.rent_amount, l.rent_period, l.start_date, l.end_date, l.status as lease_status,
                p.title as property_title, p.landlord_id as property_landlord_id
         FROM leases l
         JOIN properties p ON l.property_id = p.id
         WHERE l.id = $1`,
        [leaseId]
      );

      if (leaseCheck.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Lease not found' });
      }

      const leaseData = leaseCheck.rows[0];
      const role = req.user.role || req.user.primary_role;
      if (role !== 'admin' && leaseData.landlord_id !== landlordId && leaseData.property_landlord_id !== landlordId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Unauthorized: Lease is not managed by you' });
      }

      const normLeaseStatus = (leaseData.lease_status || '').toLowerCase();
      if (normLeaseStatus === 'cancelled' || normLeaseStatus === 'terminated') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Cannot issue invoice for a ${normLeaseStatus} lease.` });
      }

      const validTenancyStatuses = ['active', 'fully_signed', 'signed', 'moved_in', 'expired'];
      if (!validTenancyStatuses.includes(normLeaseStatus)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Invoice can only be issued for an active or signed lease (current status: "${leaseData.lease_status || 'unknown'}")`
        });
      }

      propertyId = leaseData.property_id;
      tenantId = leaseData.tenant_id;
      propertyTitle = leaseData.property_title;
      const linkedAppId = leaseData.application_id || null;

      const effectiveBillingStart = periodStart || billingPeriodStart || invIssueDate || null;
      let effectiveBillingEnd = periodEnd || billingPeriodEnd || null;
      const effectiveExtendMonths = extendLeaseByMonths ? Number(extendLeaseByMonths) : null;

      // Safe date calculation for billing period end if extendLeaseByMonths given without explicit periodEnd
      if (effectiveExtendMonths && !effectiveBillingEnd) {
        const base = leaseData.end_date
          ? new Date(leaseData.end_date)
          : (effectiveBillingStart ? new Date(effectiveBillingStart) : new Date());
        if (!isNaN(base.getTime())) {
          const d = base.getDate();
          base.setMonth(base.getMonth() + effectiveExtendMonths);
          if (base.getDate() !== d) base.setDate(0);
          effectiveBillingEnd = base.toISOString().split('T')[0];
        }
      }

      const invoiceMeta = {
        ...(metadata && typeof metadata === 'object' ? metadata : {}),
        invoiceType: effectiveExtendMonths ? 'renewal' : 'rent',
        extendLeaseByMonths: effectiveExtendMonths
      };

      const finalItems = Array.isArray(items) && items.length > 0
        ? items
        : [{ description: effectiveExtendMonths ? 'Rent Renewal' : 'Rent Payment', amount: totalPayable }];

      const generatedNum = invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
      const { rows } = await client.query(
        `INSERT INTO rent_invoices (
           lease_id, property_id, tenant_id, landlord_id, application_id,
           invoice_number, amount, subtotal, lodale_fee, grand_total,
           due_date, issue_date, status, bank_name, bank_account_number, bank_account_name,
           items, notes, billing_period_start, billing_period_end, extend_lease_by_months, metadata
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'unpaid', $13, $14, $15, $16, $17, $18, $19, $20, $21)
         RETURNING *`,
        [
          leaseId,
          propertyId,
          tenantId,
          landlordId,
          linkedAppId,
          generatedNum,
          totalPayable,
          invoiceSubtotal,
          invoiceLodaleFee,
          totalPayable,
          invDueDate,
          invIssueDate,
          bankName,
          bankAccountNumber,
          bankAccountName,
          JSON.stringify(finalItems),
          invNotes,
          effectiveBillingStart,
          effectiveBillingEnd,
          effectiveExtendMonths,
          JSON.stringify(invoiceMeta)
        ]
      );

      const createdInvoice = rows[0];

      // Notify tenant
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          tenantId,
          effectiveExtendMonths ? 'Lease Renewal Invoice Issued' : 'New Rent Invoice Issued',
          `A rent invoice of ₦${Number(totalPayable).toLocaleString()} has been issued for "${propertyTitle}" (Due: ${invDueDate}). Please complete payment.`,
          'payment',
          'invoice',
          createdInvoice.id
        ]
      );

      await client.query('COMMIT');
      return res.status(201).json(formatInvoiceRow(createdInvoice));
    }

    await client.query('ROLLBACK');
    return res.status(400).json({ error: 'Either applicationId or leaseId is required to create an invoice' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating invoice:', error);
    const message = 'Server error creating invoice';
    res.status(500).json({
      error: message,
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
    });
  } finally {
    client.release();
  }
};

// @desc    Record/Simulate payment or submit proof for an invoice
// @route   POST /api/rent/pay/:invoiceId
export const recordPayment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { invoiceId } = req.params;
    const { 
      paymentMethod, 
      paymentReference, 
      referenceNumber, 
      reference,
      paymentProofUrl, 
      notes, 
      amount
    } = req.body;

    const userId = req.user.id;
    const role = req.user.role || req.user.primary_role;
    const effectiveReference = (paymentReference || referenceNumber || reference || '').trim();

    await client.query('BEGIN');

    // Fetch invoice unambiguously: look up by invoice id first, fallback to application_id
    const baseInvoiceQuery = `
      SELECT ri.*, 
             a.status as application_status,
             COALESCE(ri.property_id, l.property_id, a.property_id) as property_id,
             COALESCE(ri.tenant_id, l.tenant_id, a.tenant_id) as tenant_id,
             COALESCE(ri.landlord_id, l.landlord_id, p.landlord_id) as landlord_id,
             p.title as property_title
      FROM rent_invoices ri
      LEFT JOIN leases l ON ri.lease_id = l.id
      LEFT JOIN property_applications a ON ri.application_id = a.id
      LEFT JOIN properties p ON (ri.property_id = p.id OR l.property_id = p.id OR a.property_id = p.id)
    `;

    let invoiceRes = await client.query(
      `${baseInvoiceQuery} WHERE ri.id::text = $1 FOR UPDATE OF ri`,
      [invoiceId]
    );

    if (invoiceRes.rowCount === 0) {
      invoiceRes = await client.query(
        `${baseInvoiceQuery} WHERE ri.application_id::text = $1 FOR UPDATE OF ri`,
        [invoiceId]
      );

      if (invoiceRes.rowCount > 1) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Ambiguous invoice reference: Multiple invoices found for application' });
      }
    }

    if (invoiceRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceRes.rows[0];

    // Authorization: caller must be a party to the invoice or admin
    const isParty = (role === 'admin' || invoice.tenant_id === userId || invoice.landlord_id === userId);
    if (!isParty) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized: You are not a party to this invoice' });
    }
    if (role === 'tenant' && invoice.tenant_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized: This is not your invoice' });
    }
    if (role === 'landlord') {
      if (invoice.landlord_id !== userId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Unauthorized: This invoice does not belong to your property' });
      }
      if (invoice.property_id) {
        const propCheck = await client.query('SELECT landlord_id FROM properties WHERE id = $1', [invoice.property_id]);
        if (propCheck.rowCount === 0 || propCheck.rows[0].landlord_id !== userId) {
          await client.query('ROLLBACK');
          return res.status(403).json({ error: 'Forbidden: You do not own the property attached to this invoice' });
        }
      }
    }

    // Return 403 with clear message when a tenant tries to use the verification path
    if (role === 'tenant' && (paymentMethod === 'Verified by Landlord' || req.body.isVerification)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Forbidden: Tenants cannot verify payments' });
    }

    const rawStatus = (invoice.status || '').trim().toLowerCase();
    const invoiceStatus = rawStatus || 'unpaid';

    // If invoice is already paid, return 409 for BOTH tenant and landlord/admin paths
    if (invoiceStatus === 'paid') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Invoice has already been paid' });
    }

    // A tenant must always go through the "submit proof / pending verification" branch
    if (role === 'tenant') {
      const allowedTenantStatuses = ['unpaid', 'overdue', 'payment_submitted'];
      if (!allowedTenantStatuses.includes(invoiceStatus)) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: `Cannot submit payment proof for invoice with status '${invoice.status}'. Only unpaid, overdue, or payment_submitted invoices can have payment proof submitted.`
        });
      }

      await client.query(
        `UPDATE rent_invoices 
         SET status = 'payment_submitted',
             payment_reference = $1,
             payment_proof_url = COALESCE($2, payment_proof_url),
             updated_at = NOW()
         WHERE id = $3`,
        [effectiveReference, paymentProofUrl || null, invoice.id]
      );

      // If application attached, advance status to payment_pending
      if (invoice.application_id) {
        await client.query(
          "UPDATE property_applications SET status = 'payment_pending', updated_at = NOW() WHERE id = $1",
          [invoice.application_id]
        );
      }

      // Notify Landlord
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          invoice.landlord_id,
          'Payment Proof Submitted',
          `Tenant submitted payment reference "${effectiveReference}" for "${invoice.property_title}". Please verify payment.`,
          'payment',
          'invoice',
          invoice.id
        ]
      );

      await client.query('COMMIT');
      return res.json({
        message: 'Payment proof submitted successfully',
        invoice: formatInvoiceRow({ ...invoice, payment_reference: effectiveReference, payment_proof_url: paymentProofUrl })
      });
    }

    // Verification path is based ONLY on authenticated role: role === 'landlord' || role === 'admin'
    const isVerification = (role === 'landlord' || role === 'admin');
    if (!isVerification) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Forbidden: Only landlords or administrators can verify payments' });
    }

    // Before inserting, sum existing rent_payments for the invoice (using integer kobo)
    const sumRes = await client.query(
      'SELECT COALESCE(SUM(amount), 0) as paid_sum FROM rent_payments WHERE invoice_id = $1',
      [invoice.id]
    );
    const existingPaidKobo = Math.round(Number(sumRes?.rows?.[0]?.paid_sum || 0) * 100);
    const expectedKobo = Math.round(getExpectedInvoiceAmount(invoice) * 100);
    const remainingKobo = Math.max(0, expectedKobo - existingPaidKobo);
    const remaining = remainingKobo / 100;

    let paymentRecord = null;
    let payAmount = 0;
    let willBePaid = false;

    // Landlord verifying or full payment confirmation
    let customPaymentDate = null;
    const reqPaymentDate = req.body.payment_date || req.body.paymentDate;

    if (isVerification && reqPaymentDate) {
      const parsedPayDate = new Date(reqPaymentDate);
      if (isNaN(parsedPayDate.getTime())) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Payment date must be a valid date' });
      }

      const nowLagosStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date());
      const reqDateStr = typeof reqPaymentDate === 'string' && /^\d{4}-\d{1,2}-\d{1,2}$/.test(reqPaymentDate)
        ? reqPaymentDate
        : parsedPayDate.toISOString().split('T')[0];

      if (reqDateStr > nowLagosStr) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Payment date cannot be in the future' });
      }
      customPaymentDate = reqDateStr;
    }

    if (remainingKobo === 0) {
      // If remaining is 0 (kobo) and the invoice is not paid, do NOT insert a payment row; just mark the invoice paid
      willBePaid = true;
      payAmount = 0;
    } else {
      let isPartial = req.body?.partial === true;

      if (amount === undefined || amount === null || amount === '') {
        payAmount = remaining;
        isPartial = false;
      } else {
        const parsedAmount = Number(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Payment amount must be a positive number' });
        }

        const payAmountKobo = Math.round(parsedAmount * 100);

        if (payAmountKobo > remainingKobo) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: `Payment amount (₦${parsedAmount.toLocaleString()}) exceeds the remaining invoice balance (₦${remaining.toLocaleString()}).`,
            remaining,
            amount: parsedAmount
          });
        }

        if (payAmountKobo < remainingKobo && !isPartial) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: `Payment amount (₦${parsedAmount.toLocaleString()}) is less than the expected invoice amount (remaining: ₦${remaining.toLocaleString()}). Set partial: true to record a partial payment.`,
            remaining,
            expectedAmount: expectedKobo / 100,
            amount: parsedAmount
          });
        }

        payAmount = parsedAmount;
      }

      const payAmountKobo = Math.round(payAmount * 100);
      willBePaid = (existingPaidKobo + payAmountKobo) >= expectedKobo;

      const paymentRes = await client.query(
        `INSERT INTO rent_payments (invoice_id, lease_id, application_id, property_id, tenant_id, amount, payment_date, payment_method, reference_number, notes)
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($10::date, CURRENT_DATE), $7, $8, $9)
         RETURNING *`,
        [
          invoice.id,
          invoice.lease_id || null,
          invoice.application_id || null,
          invoice.property_id || null,
          invoice.tenant_id || null,
          payAmount,
          paymentMethod || 'Bank Transfer',
          effectiveReference || invoice.payment_reference || 'MANUAL_VERIFY',
          notes || (!willBePaid ? 'Partial payment verified by landlord' : 'Verified by Landlord'),
          customPaymentDate
        ]
      );
      paymentRecord = paymentRes.rows[0];
    }

    if (willBePaid) {
      // Update invoice status to paid
      await client.query(
        "UPDATE rent_invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = $1",
        [invoice.id]
      );

      // If attached to application, update status to rent_paid only when appropriate (do not regress moved_in tenancies)
      if (invoice.application_id) {
        await client.query(
          `UPDATE property_applications 
           SET status = 'rent_paid', updated_at = NOW() 
           WHERE (id = $1 OR invoice_id = $2) AND status IN ('invoice_issued', 'payment_pending')`,
          [invoice.application_id, invoice.id]
        );
      }

      // If attached to a lease, activate lease if ready
      if (invoice.lease_id) {
        const leaseRes = await client.query(
          `SELECT l.*, u.first_name || ' ' || u.last_name as tenant_name
           FROM leases l
           JOIN users u ON l.tenant_id = u.id
           WHERE l.id = $1`,
          [invoice.lease_id]
        );

        if (leaseRes.rowCount > 0) {
          const targetLease = leaseRes.rows[0];
          if (targetLease.status === 'signed' || targetLease.status === 'draft') {
            await client.query("UPDATE leases SET status = 'active', updated_at = NOW() WHERE id = $1", [targetLease.id]);
            await client.query(
              `UPDATE properties 
               SET status = 'active_occupied', is_occupied = true, tenant_name = $1, lease_start_date = $2, updated_at = NOW() 
               WHERE id = $3`,
              [targetLease.tenant_name, targetLease.start_date, targetLease.property_id]
            );
          }
        }
      }

      // Safely apply lease renewal extension if renewal metadata exists
      await applyLeaseRenewalIfApplicable(client, invoice);
    } else {
      // Partial payment: touch updated_at
      await client.query(
        "UPDATE rent_invoices SET updated_at = NOW() WHERE id = $1",
        [invoice.id]
      );
    }

    await client.query('COMMIT');

    // Notify tenant of confirmed or partial payment
    try {
      const notifTitle = willBePaid ? 'Payment Confirmed' : 'Partial Payment Recorded';
      const notifMsg = willBePaid
        ? (paymentRecord 
            ? `Your payment of ₦${Number(payAmount).toLocaleString()} for "${invoice.property_title}" has been verified and confirmed by the landlord.`
            : `Your invoice for "${invoice.property_title}" has been verified and marked as fully paid by the landlord.`)
        : `A partial payment of ₦${Number(payAmount).toLocaleString()} for "${invoice.property_title}" has been recorded by the landlord. Remaining balance: ₦${(remaining - payAmount).toLocaleString()}.`;

      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          invoice.tenant_id,
          notifTitle,
          notifMsg,
          'payment',
          'invoice',
          invoice.id
        ]
      );
    } catch (notifErr) {
      console.warn('Failed to dispatch payment confirmation notification:', notifErr.message);
    }

    let realApplicationStatus;
    if (invoice.application_id) {
      realApplicationStatus = willBePaid ? 'rent_paid' : (invoice.application_status || undefined);
    }

    res.json({
      message: willBePaid ? 'Payment recorded and confirmed successfully' : 'Partial payment recorded successfully',
      payment: paymentRecord || null,
      invoice: formatInvoiceRow({
        ...invoice,
        ...(willBePaid ? { status: 'paid', paid_at: new Date() } : {})
      }),
      paid: willBePaid,
      remainingBalance: Math.max(0, (remainingKobo - (paymentRecord ? Math.round(payAmount * 100) : 0)) / 100),
      ...(realApplicationStatus ? { applicationStatus: realApplicationStatus } : {})
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording payment:', error);
    const message = 'Server error recording payment';
    res.status(500).json({
      error: message,
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
    });
  } finally {
    client.release();
  }
};

// @desc    Initialize Paystack transaction for an invoice
// @route   POST /api/rent/paystack/initialize/:invoiceId
export const initializePaystackPayment = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Fetch invoice unambiguously: look up by invoice id first, fallback to application_id
    const baseInvoiceQuery = `
      SELECT ri.*, 
             COALESCE(ri.property_id, l.property_id, a.property_id) as property_id,
             COALESCE(ri.tenant_id, l.tenant_id, a.tenant_id) as tenant_id,
             COALESCE(ri.landlord_id, l.landlord_id, p.landlord_id) as landlord_id,
             p.title as property_title,
             lp.paystack_subaccount_code,
             lp.bank_account_number as landlord_bank_account_number,
             lp.bank_name as landlord_bank_name,
             lp.business_name as landlord_business_name,
             lp.bank_account_name as landlord_bank_account_name,
             lu.first_name as landlord_first_name,
             lu.last_name as landlord_last_name
      FROM rent_invoices ri
      LEFT JOIN leases l ON ri.lease_id = l.id
      LEFT JOIN property_applications a ON ri.application_id = a.id
      LEFT JOIN properties p ON (ri.property_id = p.id OR l.property_id = p.id OR a.property_id = p.id)
      LEFT JOIN users lu ON (ri.landlord_id = lu.id OR l.landlord_id = lu.id OR p.landlord_id = lu.id)
      LEFT JOIN landlord_profiles lp ON lp.user_id = lu.id
    `;

    let invoiceRes = await pool.query(
      `${baseInvoiceQuery} WHERE ri.id::text = $1`,
      [invoiceId]
    );

    if (invoiceRes.rowCount === 0) {
      invoiceRes = await pool.query(
        `${baseInvoiceQuery} WHERE ri.application_id::text = $1`,
        [invoiceId]
      );

      if (invoiceRes.rowCount > 1) {
        return res.status(409).json({ error: 'Ambiguous invoice reference: Multiple invoices found for application' });
      }
    }

    if (invoiceRes.rowCount === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceRes.rows[0];

    // Auth: Tenant who owns invoice (or admin)
    const role = req.user.role || req.user.primary_role;
    if (role !== 'admin' && invoice.tenant_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized: This is not your invoice' });
    }

    // Invoice must be unpaid (null/empty treated as 'unpaid')
    const invoiceStatus = (invoice.status || '').trim().toLowerCase() || 'unpaid';
    if (invoiceStatus === 'paid') {
      return res.status(400).json({ error: 'Invoice is already paid' });
    }

    // Landlord must have paystack_subaccount_code
    let subaccountCode = invoice.paystack_subaccount_code;

    const landlordBankAcc = invoice.landlord_bank_account_number || invoice.bank_account_number;
    const landlordBankName = invoice.landlord_bank_name || invoice.bank_name;

    let autoCreateErr = null;
    if (!subaccountCode && landlordBankAcc && landlordBankName) {
      try {
        const bName =
          invoice.landlord_business_name ||
          invoice.landlord_bank_account_name ||
          invoice.bank_account_name ||
          `${invoice.landlord_first_name || ''} ${invoice.landlord_last_name || ''}`.trim() ||
          'Lodale Landlord';

        const createdSub = await paystackService.createOrUpdateSubaccount({
          businessName: bName,
          bankCodeOrName: landlordBankName,
          accountNumber: landlordBankAcc,
        });

        if (createdSub?.subaccount_code) {
          subaccountCode = createdSub.subaccount_code;
          if (invoice.landlord_id) {
            await ProfileModel.updateLandlordSubaccountCode(invoice.landlord_id, subaccountCode);
          }
        }
      } catch (err) {
        console.error('[Paystack Initialize] Auto subaccount resolution failed:', err.message);
        autoCreateErr = err.message;
      }
    }

    if (!subaccountCode) {
      const detail = autoCreateErr ? ` (${autoCreateErr})` : '';
      return res.status(400).json({
        error: `Landlord payout account is not configured yet${detail}. The landlord must add and verify their Nigerian bank account in Landlord Dashboard > Settings before rent payments can be processed via Paystack.`,
        code: 'LANDLORD_BANK_SETUP_REQUIRED',
      });
    }

    // Compute remaining balance = getExpectedInvoiceAmount(invoice) minus SUM(amount) of rent_payments
    const sumRes = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as paid_sum FROM rent_payments WHERE invoice_id = $1',
      [invoice.id]
    );
    const existingPaidKobo = Math.round(Number(sumRes.rows[0]?.paid_sum || 0) * 100);
    const expectedKobo = Math.round(getExpectedInvoiceAmount(invoice) * 100);
    const remainingKobo = Math.max(0, expectedKobo - existingPaidKobo);

    if (remainingKobo <= 0) {
      return res.status(409).json({ error: 'Invoice has no remaining balance to pay' });
    }

    // Charge remaining balance (kobo) and compute platform fee on that amount
    const amountKobo = remainingKobo;
    const platformFeeKobo = Math.round(amountKobo * (PLATFORM_FEE_PERCENT / 100));
    const reference = `LODALE_${String(invoice.id).replace(/-/g, '').substring(0, 8)}_${Date.now()}`;
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${frontendBase}/dashboard/tenant`;

    const txData = await paystackService.initializeTransaction({
      email: userEmail,
      amountKobo,
      reference,
      subaccountCode,
      transactionChargeKobo: platformFeeKobo,
      callbackUrl,
      metadata: {
        invoice_id: invoice.id,
        lease_id: invoice.lease_id || null,
        tenant_id: invoice.tenant_id,
        landlord_id: invoice.landlord_id,
        property_id: invoice.property_id,
        application_id: invoice.application_id || null,
        invoice_number: invoice.invoice_number,
        platform_fee_kobo: platformFeeKobo,
        amount_kobo: amountKobo,
      },
    });

    res.json({
      authorization_url: txData.authorization_url,
      access_code: txData.access_code,
      reference: txData.reference,
      publicKey: (process.env.PAYSTACK_PUBLIC_KEY || '').trim(),
    });
  } catch (error) {
    console.error('Error initializing Paystack transaction:', error);
    const message = 'Server error initializing Paystack transaction';
    res.status(500).json({
      error: message,
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
    });
  }
};

// Shared idempotent helper to mark an invoice paid via Paystack
export async function markInvoicePaidWithPaystackHelper({ invoice, paystackData, reference, remainingKobo: passedRemainingKobo }) {
  const client = await pool.connect();
  try {
    // 1. Idempotency check before transaction: check if this reference was already recorded
    const existingPaymentRes = await client.query(
      'SELECT * FROM rent_payments WHERE reference_number = $1 LIMIT 1',
      [reference]
    );

    if (existingPaymentRes.rowCount > 0) {
      const isInvoicePaid = normalizeInvoiceStatus(invoice.status) === 'paid';
      const targetAppId = invoice.application_id || invoice.applicationId;
      if (isInvoicePaid && (targetAppId || invoice.id)) {
        await client.query(
          "UPDATE property_applications SET status = 'rent_paid', updated_at = NOW() WHERE (id = $1 OR invoice_id = $2) AND status IN ('invoice_issued', 'payment_pending')",
          [targetAppId || null, invoice.id]
        );
      }
      return {
        alreadyProcessed: true,
        invoice,
        payment: existingPaymentRes.rows[0] || null,
        isPaid: isInvoicePaid,
      };
    }

    await client.query('BEGIN');

    // Double check inside transaction with lock to prevent race conditions
    const currentInvRes = await client.query('SELECT * FROM rent_invoices WHERE id = $1 FOR UPDATE', [invoice.id]);
    const currentInv = currentInvRes.rows[0] || invoice;

    // Fix race condition: re-check if reference was already recorded by a concurrent process
    const lockedRefCheckRes = await client.query(
      'SELECT * FROM rent_payments WHERE reference_number = $1 LIMIT 1',
      [reference]
    );
    if (lockedRefCheckRes.rowCount > 0) {
      await client.query('COMMIT');
      return {
        alreadyProcessed: true,
        invoice: currentInv,
        payment: lockedRefCheckRes.rows[0],
        isPaid: normalizeInvoiceStatus(currentInv.status) === 'paid',
      };
    }

    // Recompute remainingKobo from DB inside transaction: expected invoice kobo minus SUM(amount) of rent_payments (excluding this reference)
    const sumRes = await client.query(
      'SELECT COALESCE(SUM(amount), 0) as paid_sum FROM rent_payments WHERE invoice_id = $1 AND (reference_number IS NULL OR reference_number != $2)',
      [currentInv.id, reference]
    );
    const existingPaidKobo = Math.round(Number(sumRes.rows[0]?.paid_sum || 0) * 100);
    const expectedKobo = Math.round(getExpectedInvoiceAmount(currentInv) * 100);
    const remainingKobo = Math.max(0, expectedKobo - existingPaidKobo);

    const isAlreadyPaid = normalizeInvoiceStatus(currentInv.status) === 'paid';
    const paidAmount = Number(paystackData.amount) / 100;
    const paidAtIso = paystackData.paid_at || new Date().toISOString();

    if (isAlreadyPaid) {
      // Invoice is already paid: still INSERT the Paystack payment row with notes 'Duplicate/overpayment - needs refund review'
      const paymentRes = await client.query(
        `INSERT INTO rent_payments (
          invoice_id, lease_id, application_id, property_id, tenant_id,
          amount, payment_date, payment_method, reference_number, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz::date, $8, $9, $10)
        RETURNING *`,
        [
          currentInv.id,
          currentInv.lease_id || invoice.lease_id || null,
          currentInv.application_id || invoice.application_id || null,
          currentInv.property_id || invoice.property_id || null,
          currentInv.tenant_id || invoice.tenant_id || null,
          paidAmount,
          paidAtIso,
          'Paystack',
          reference,
          'Duplicate/overpayment - needs refund review',
        ]
      );

      await client.query('COMMIT');

      // Create a notification for every admin user plus the landlord
      try {
        const adminRes = await pool.query("SELECT id FROM users WHERE primary_role = 'admin'");
        const adminIds = adminRes.rows.map(r => r.id);
        const landlordId = currentInv.landlord_id || invoice.landlord_id;
        const recipientIds = new Set(adminIds);
        if (landlordId) recipientIds.add(landlordId);

        const notifTitle = 'Duplicate Payment Review';
        const notifMsg = `A payment of ₦${Number(paidAmount).toLocaleString()} with reference "${reference}" was received for already-paid invoice #${currentInv.invoice_number || currentInv.id} on "${currentInv.property_title || invoice.property_title || 'Property'}". Needs refund review.`;

        for (const uid of recipientIds) {
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [uid, notifTitle, notifMsg, 'payment', 'invoice', currentInv.id]
          );
        }
      } catch (notifErr) {
        console.warn('Failed to dispatch duplicate payment notifications:', notifErr.message);
      }

      return {
        alreadyProcessed: true,
        invoice: currentInv,
        payment: paymentRes.rows[0],
        isPaid: true,
      };
    }

    // Invoice was not paid yet: determine if overpaid using recomputed remainingKobo from DB
    const paidKobo = Math.round(Number(paystackData.amount || 0));
    const isOverpaid = paidKobo > remainingKobo;
    const overpaidKobo = isOverpaid ? paidKobo - remainingKobo : 0;
    const overpaidAmount = overpaidKobo / 100;

    let paymentNotes = 'Paid via Paystack gateway split transaction';
    if (isOverpaid) {
      paymentNotes = `Paid via Paystack gateway split transaction (Overpayment of ₦${Number(overpaidAmount).toLocaleString()} - needs refund review)`;
    }

    // Insert payment record into rent_payments
    const paymentRes = await client.query(
      `INSERT INTO rent_payments (
        invoice_id, lease_id, application_id, property_id, tenant_id,
        amount, payment_date, payment_method, reference_number, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz::date, $8, $9, $10)
      RETURNING *`,
      [
        currentInv.id,
        currentInv.lease_id || invoice.lease_id || null,
        currentInv.application_id || invoice.application_id || null,
        currentInv.property_id || invoice.property_id || null,
        currentInv.tenant_id || invoice.tenant_id || null,
        paidAmount,
        paidAtIso,
        'Paystack',
        reference,
        paymentNotes,
      ]
    );

    // Update invoice status to paid
    const updatedInvRes = await client.query(
      `UPDATE rent_invoices
       SET status = 'paid',
           payment_reference = $1,
           paid_at = $2::timestamptz,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [reference, paidAtIso, currentInv.id]
    );

    // If attached to application, advance status to rent_paid
    const targetAppId = currentInv.application_id || invoice.application_id;
    if (targetAppId || currentInv.id) {
      await client.query(
        "UPDATE property_applications SET status = 'rent_paid', updated_at = NOW() WHERE (id = $1 OR invoice_id = $2) AND status IN ('invoice_issued', 'payment_pending')",
        [targetAppId || null, currentInv.id]
      );
    }

    // If attached to a lease, activate lease if signed or draft
    const leaseId = currentInv.lease_id || invoice.lease_id;
    if (leaseId) {
      const leaseRes = await client.query(
        `SELECT l.*, u.first_name || ' ' || u.last_name as tenant_name
         FROM leases l
         JOIN users u ON l.tenant_id = u.id
         WHERE l.id = $1`,
        [leaseId]
      );

      if (leaseRes.rowCount > 0) {
        const targetLease = leaseRes.rows[0];
        if (targetLease.status === 'signed' || targetLease.status === 'draft') {
          await client.query("UPDATE leases SET status = 'active', updated_at = NOW() WHERE id = $1", [targetLease.id]);
          await client.query(
            `UPDATE properties 
             SET status = 'active_occupied', is_occupied = true, tenant_name = $1, lease_start_date = $2, updated_at = NOW() 
             WHERE id = $3`,
            [targetLease.tenant_name, targetLease.start_date, targetLease.property_id]
          );
        }
      }
    }

    // Safely apply lease renewal extension if renewal metadata exists
    await applyLeaseRenewalIfApplicable(client, currentInv);

    await client.query('COMMIT');

    // Notify landlord and tenant
    try {
      const landlordId = currentInv.landlord_id || invoice.landlord_id;
      const tenantId = currentInv.tenant_id || invoice.tenant_id;

      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
         VALUES 
         ($1, $2, $3, $4, $5, $6),
         ($7, $8, $9, $10, $11, $12)`,
        [
          landlordId,
          'Rent Payment Received',
          isOverpaid
            ? `Tenant paid ₦${Number(paidAmount).toLocaleString()} via Paystack for "${invoice.property_title || 'Property'}" (Overpayment of ₦${Number(overpaidAmount).toLocaleString()} - needs refund review).`
            : `Tenant paid ₦${Number(paidAmount).toLocaleString()} via Paystack for "${invoice.property_title || 'Property'}". Payout will settle to your bank account.`,
          'payment',
          'invoice',
          currentInv.id,
          tenantId,
          'Payment Confirmed',
          `Your payment of ₦${Number(paidAmount).toLocaleString()} via Paystack was successful and confirmed.`,
          'payment',
          'invoice',
          currentInv.id,
        ]
      );

      if (isOverpaid) {
        const adminRes = await pool.query("SELECT id FROM users WHERE primary_role = 'admin'");
        for (const adminRow of adminRes.rows) {
          if (adminRow.id !== landlordId) {
            await pool.query(
              `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                adminRow.id,
                'Overpayment Review',
                `A payment of ₦${Number(paidAmount).toLocaleString()} with reference "${reference}" exceeded remaining balance by ₦${Number(overpaidAmount).toLocaleString()} on invoice #${currentInv.invoice_number || currentInv.id}. Needs refund review.`,
                'payment',
                'invoice',
                currentInv.id
              ]
            );
          }
        }
      }
    } catch (notifErr) {
      console.warn('Failed to dispatch payment notifications:', notifErr.message);
    }

    return {
      alreadyProcessed: false,
      invoice: updatedInvRes.rows[0] || currentInv,
      payment: paymentRes.rows[0],
    };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      // ignore rollback failure
    }

    if ((err.code === '23505' || err.code === 23505) && err.constraint === 'rent_payments_paystack_ref_uniq') {
      try {
        const reReadPayment = await pool.query(
          'SELECT * FROM rent_payments WHERE reference_number = $1 LIMIT 1',
          [reference]
        );
        const reReadInv = await pool.query(
          'SELECT * FROM rent_invoices WHERE id = $1',
          [invoice.id]
        );
        const latestInv = reReadInv.rows[0] || invoice;
        return {
          alreadyProcessed: true,
          invoice: latestInv,
          payment: reReadPayment.rows[0] || null,
          isPaid: normalizeInvoiceStatus(latestInv.status) === 'paid',
        };
      } catch (readErr) {
        console.error('Error re-reading payment after unique violation:', readErr);
      }
    }
    throw err;
  } finally {
    client.release();
  }
}

// @desc    Verify Paystack payment by reference
// @route   POST /api/rent/paystack/verify
export const verifyPaystackPayment = async (req, res) => {
  try {
    const { reference, invoiceId: reqInvoiceId } = req.body;
    if (!reference) {
      return res.status(400).json({ error: 'Payment reference is required' });
    }

    const userId = req.user.id;
    const role = req.user.role || req.user.primary_role;

    // 1. Verify transaction with Paystack API
    const paystackData = await paystackService.verifyTransaction(reference);

    if (paystackData.status !== 'success') {
      return res.status(400).json({
        error: `Paystack payment not successful (status: ${paystackData.status})`,
        gateway_response: paystackData.gateway_response,
      });
    }

    if ((paystackData.currency || '').toUpperCase() !== 'NGN') {
      return res.status(400).json({
        error: `Invalid currency: Only NGN payments are accepted, got ${paystackData.currency}`,
      });
    }

    // 2. Identify and validate the target invoice
    const metadataInvoiceId = paystackData.metadata?.invoice_id;
    if (!metadataInvoiceId) {
      return res.status(400).json({ error: 'Paystack payment metadata is missing invoice_id' });
    }

    if (reqInvoiceId && String(reqInvoiceId).trim() !== String(metadataInvoiceId).trim()) {
      return res.status(400).json({ error: 'Invoice ID does not match transaction metadata invoice_id' });
    }

    const targetInvoiceId = metadataInvoiceId;

    let invoice = null;

    if (targetInvoiceId) {
      const invRes = await pool.query(
        `SELECT ri.*, 
                COALESCE(ri.application_id, a.id) as application_id,
                a.status as application_status,
                COALESCE(ri.property_id, l.property_id, a.property_id) as property_id,
                COALESCE(ri.tenant_id, l.tenant_id, a.tenant_id) as tenant_id,
                COALESCE(ri.landlord_id, l.landlord_id, p.landlord_id) as landlord_id,
                p.title as property_title
         FROM rent_invoices ri
         LEFT JOIN leases l ON ri.lease_id = l.id
         LEFT JOIN property_applications a ON (ri.application_id = a.id OR a.invoice_id = ri.id)
         LEFT JOIN properties p ON (ri.property_id = p.id OR l.property_id = p.id OR a.property_id = p.id)
         WHERE ri.id::text = $1`,
        [String(targetInvoiceId)]
      );
      if (invRes.rowCount > 0) invoice = invRes.rows[0];
    }

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice associated with this payment reference was not found' });
    }

    // Verify caller is the invoice's tenant (or admin) before doing anything
    if (role !== 'admin' && invoice.tenant_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized: This is not your invoice' });
    }

    // Reject (409) a reference that already has a rent_payments row for a DIFFERENT invoice (without leaking invoice ID)
    const existingRefPaymentRes = await pool.query(
      'SELECT id, invoice_id, reference_number FROM rent_payments WHERE reference_number = $1',
      [reference]
    );
    if (existingRefPaymentRes.rowCount > 0) {
      const existingPayment = existingRefPaymentRes.rows[0];
      if (String(existingPayment.invoice_id) !== String(targetInvoiceId)) {
        return res.status(409).json({
          error: `Payment reference '${reference}' has already been applied to a different invoice`
        });
      }
    }

    // Compare amount Paystack reports (kobo) with remaining invoice amount (kobo)
    const sumRes = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as paid_sum FROM rent_payments WHERE invoice_id = $1 AND (reference_number IS NULL OR reference_number != $2)',
      [invoice.id, reference]
    );
    const existingPaidKobo = Math.round(Number(sumRes.rows[0]?.paid_sum || 0) * 100);
    const expectedKobo = Math.round(getExpectedInvoiceAmount(invoice) * 100);
    const remainingKobo = Math.max(0, expectedKobo - existingPaidKobo);
    const paidAmountKobo = Number(paystackData.amount || 0);

    if (paidAmountKobo < remainingKobo) {
      return res.status(400).json({
        error: `Underpaid amount: Expected ₦${(remainingKobo / 100).toLocaleString()} (${remainingKobo} kobo), but Paystack reports ₦${(paidAmountKobo / 100).toLocaleString()} (${paidAmountKobo} kobo)`,
        expectedAmountKobo: remainingKobo,
        remainingAmountKobo: remainingKobo,
        paidAmountKobo,
      });
    }

    // Execute shared mark invoice paid logic
    const result = await markInvoicePaidWithPaystackHelper({ invoice, paystackData, reference, remainingKobo });

    const isPaid = Boolean(result.isPaid ?? (((result.invoice?.status || invoice.status || '').trim().toLowerCase() || 'unpaid') === 'paid'));

    if (result.alreadyProcessed) {
      return res.json({
        message: 'Payment verified (already processed)',
        invoice: formatInvoiceRow({ ...invoice, ...result.invoice, ...(isPaid ? { status: 'paid' } : {}), payment_method: 'Paystack', paymentMethod: 'Paystack' }),
        payment: result.payment || null,
        paid: isPaid,
        applicationStatus: isPaid ? 'rent_paid' : (invoice.application_status || 'payment_pending'),
      });
    }

    return res.json({
      message: 'Payment confirmed successfully via Paystack',
      invoice: formatInvoiceRow({
        ...invoice,
        ...result.invoice,
        status: 'paid',
        paid_at: paystackData.paid_at || new Date().toISOString(),
        payment_method: 'Paystack',
        paymentMethod: 'Paystack',
      }),
      payment: result.payment,
      paid: true,
      applicationStatus: 'rent_paid',
    });
  } catch (error) {
    console.error('Error verifying Paystack payment:', error);
    const message = 'Server error verifying Paystack payment';
    return res.status(500).json({
      error: message,
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {})
    });
  }
};

// @desc    Handle Paystack Webhook
// @route   POST /api/rent/paystack/webhook or /api/paystack/webhook
export const handlePaystackWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!signature || !secret) {
      return res.status(400).json({ error: 'Missing webhook signature or secret key' });
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}), 'utf8');

    const expectedHash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

    let isValid = false;
    try {
      const hashBuf = Buffer.from(expectedHash, 'utf8');
      const sigBuf = Buffer.from(String(signature), 'utf8');
      if (hashBuf.length === sigBuf.length && crypto.timingSafeEqual(hashBuf, sigBuf)) {
        isValid = true;
      }
    } catch (e) {
      isValid = false;
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch (parseErr) {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    // Always respond 200 quickly once signature is valid
    if (payload.event !== 'charge.success') {
      return res.status(200).json({ status: 'ignored' });
    }

    const paystackData = payload.data || {};
    const reference = paystackData.reference;

    if (!reference) {
      return res.status(200).json({ status: 'ignored', message: 'No reference in event data' });
    }

    if (paystackData.status !== 'success' || (paystackData.currency || '').toUpperCase() !== 'NGN') {
      return res.status(200).json({ status: 'ignored', message: 'Transaction not successful or invalid currency' });
    }

    // Find invoice
    const targetInvoiceId = paystackData.metadata?.invoice_id;
    if (!targetInvoiceId) {
      console.warn(`[Paystack Webhook] Ignored charge.success event: missing metadata.invoice_id (reference: ${reference})`);
      return res.status(200).json({ status: 'ignored', message: 'Missing invoice_id in metadata' });
    }

    // Check if reference has already been applied to a different invoice
    const existingRefRes = await pool.query(
      'SELECT id, invoice_id FROM rent_payments WHERE reference_number = $1',
      [reference]
    );
    if (existingRefRes.rowCount > 0) {
      const existingPayment = existingRefRes.rows[0];
      if (String(existingPayment.invoice_id) !== String(targetInvoiceId)) {
        console.warn(`[Paystack Webhook] Ignored payment: reference '${reference}' already applied to different invoice (${existingPayment.invoice_id})`);
        return res.status(200).json({ status: 'ignored', message: 'Reference already applied to a different invoice' });
      }
    }

    let invoice = null;

    const invRes = await pool.query(
      `SELECT ri.*, 
              COALESCE(ri.application_id, a.id) as application_id,
              a.status as application_status,
              COALESCE(ri.property_id, l.property_id, a.property_id) as property_id,
              COALESCE(ri.tenant_id, l.tenant_id, a.tenant_id) as tenant_id,
              COALESCE(ri.landlord_id, l.landlord_id, p.landlord_id) as landlord_id,
              p.title as property_title
       FROM rent_invoices ri
       LEFT JOIN leases l ON ri.lease_id = l.id
       LEFT JOIN property_applications a ON (ri.application_id = a.id OR a.invoice_id = ri.id)
       LEFT JOIN properties p ON (ri.property_id = p.id OR l.property_id = p.id OR a.property_id = p.id)
       WHERE ri.id::text = $1`,
      [String(targetInvoiceId)]
    );
    if (invRes.rowCount > 0) invoice = invRes.rows[0];

    if (!invoice) {
      console.error(`[Paystack Webhook] Invoice not found for reference ${reference}, amount ${paystackData.amount}`);
      return res.status(200).json({ status: 'ignored', message: 'Invoice not found' });
    }

    const sumRes = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as paid_sum FROM rent_payments WHERE invoice_id = $1 AND (reference_number IS NULL OR reference_number != $2)',
      [invoice.id, reference]
    );
    const existingPaidKobo = Math.round(Number(sumRes.rows[0]?.paid_sum || 0) * 100);
    const expectedKobo = Math.round(getExpectedInvoiceAmount(invoice) * 100);
    const remainingKobo = Math.max(0, expectedKobo - existingPaidKobo);
    const paidAmountKobo = Number(paystackData.amount || 0);

    if (paidAmountKobo < remainingKobo) {
      console.error(`[Paystack Webhook] Underpaid payment for invoice ${invoice.id}: expected ${remainingKobo} kobo, received ${paidAmountKobo} kobo`);
      return res.status(200).json({ status: 'ignored', message: 'Underpaid payment' });
    }

    await markInvoicePaidWithPaystackHelper({ invoice, paystackData, reference, remainingKobo });

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error handling Paystack webhook:', error);
    return res.status(500).json({ error: 'Server error processing webhook' });
  }
};

// @desc    Get verified Nigerian banks list from Paystack
// @route   GET /api/rent/banks
export const getBanksList = async (req, res) => {
  try {
    const banks = await paystackService.listBanks();
    res.json({
      banks: (banks || []).map((b) => ({
        name: b.name,
        code: b.code,
        slug: b.slug,
      })),
    });
  } catch (err) {
    console.error('Error fetching banks list:', err);
    const message = 'Failed to fetch Nigerian banks from Paystack';
    res.status(500).json({
      error: message,
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    });
  }
};

// @desc    Get all receipts for landlord's confirmed payments
// @route   GET /api/rent/receipts
export const getLandlordReceipts = async (req, res) => {
  try {
    const landlordId = req.user.id;

    const query = `
      SELECT 
        rp.id as payment_id,
        rp.id,
        rp.invoice_id,
        rp.lease_id,
        COALESCE(rp.property_id, ri.property_id, l.property_id) as property_id,
        COALESCE(rp.tenant_id, ri.tenant_id, l.tenant_id) as tenant_id,
        COALESCE(ri.landlord_id, p.landlord_id, l.landlord_id) as landlord_id,
        rp.amount,
        COALESCE(rp.payment_date::text, ri.paid_at::text, rp.created_at::text) as payment_date,
        COALESCE(rp.payment_method, ri.payment_method, ri.bank_name, 'Paystack') as payment_method,
        COALESCE(rp.reference_number, ri.payment_reference, 'N/A') as reference_number,
        rp.notes,
        rp.signed_by,
        rp.signed_at,
        rp.sent_at,
        rp.receipt_number,
        rp.created_at,
        p.title as property_title,
        (COALESCE(p.address_line1, '') || CASE WHEN p.city IS NOT NULL AND p.city != '' THEN ', ' || p.city ELSE '' END || CASE WHEN p.state IS NOT NULL AND p.state != '' THEN ', ' || p.state ELSE '' END) as property_address,
        tu.first_name || ' ' || tu.last_name as tenant_name,
        tu.email as tenant_email,
        tu.phone_number as tenant_phone,
        lu.first_name || ' ' || lu.last_name as landlord_name,
        lu.email as landlord_email,
        lu.phone_number as landlord_phone,
        ri.invoice_number,
        ri.items as invoice_items,
        ri.billing_period_start,
        ri.billing_period_end
      FROM rent_payments rp
      LEFT JOIN rent_invoices ri ON rp.invoice_id = ri.id
      LEFT JOIN leases l ON (rp.lease_id = l.id OR ri.lease_id = l.id)
      LEFT JOIN properties p ON (rp.property_id = p.id OR ri.property_id = p.id OR l.property_id = p.id)
      LEFT JOIN users tu ON (rp.tenant_id = tu.id OR ri.tenant_id = tu.id OR l.tenant_id = tu.id)
      LEFT JOIN users lu ON (p.landlord_id = lu.id OR ri.landlord_id = lu.id OR l.landlord_id = lu.id)
      WHERE (p.landlord_id = $1 OR ri.landlord_id = $1 OR l.landlord_id = $1)
        AND (rp.notes IS NULL OR rp.notes NOT LIKE '%Duplicate/overpayment%')
      ORDER BY rp.payment_date DESC, rp.created_at DESC
    `;

    const { rows } = await pool.query(query, [landlordId]);

    const receipts = rows
      .filter((r) => !r.notes || !r.notes.includes('Duplicate/overpayment'))
      .map((r) => {
      let parsedItems = [];
      if (Array.isArray(r.invoice_items)) {
        parsedItems = r.invoice_items;
      } else if (typeof r.invoice_items === 'string') {
        try {
          parsedItems = JSON.parse(r.invoice_items);
        } catch (e) {
          parsedItems = [];
        }
      }

      if (!parsedItems || parsedItems.length === 0) {
        parsedItems = [
          {
            description: 'Annual Rent / Rental Payment',
            amount: Number(r.amount || 0),
          },
        ];
      }

      const receiptNum =
        r.receipt_number ||
        (r.reference_number && r.reference_number !== 'N/A' && r.reference_number.length >= 6
          ? `LOD-REC-${r.reference_number.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '')}`
          : `LOD-REC-${String(r.id).slice(0, 8).toUpperCase()}`);

      let status = 'generated';
      if (r.sent_at) {
        status = 'sent';
      } else if (r.signed_at || r.signed_by) {
        status = 'signed';
      }

      return {
        id: r.id,
        paymentId: r.payment_id,
        invoiceId: r.invoice_id,
        leaseId: r.lease_id,
        propertyId: r.property_id,
        tenantId: r.tenant_id,
        landlordId: r.landlord_id,
        receiptNumber: receiptNum,
        amount: Number(r.amount || 0),
        paymentDate: safeFormatDate(r.payment_date),
        paymentMethod: r.payment_method || 'Paystack',
        referenceNumber: r.reference_number,
        notes: r.notes || '',
        signedBy: r.signed_by || null,
        signedAt: r.signed_at || null,
        sentAt: r.sent_at || null,
        status, // 'generated' | 'signed' | 'sent'
        propertyTitle: r.property_title || 'Rental Property',
        propertyAddress: r.property_address || '',
        tenantName: (r.tenant_name || '').trim() || 'Tenant',
        tenantEmail: r.tenant_email || '',
        tenantPhone: r.tenant_phone || '',
        landlordName: (r.landlord_name || '').trim() || 'Property Owner',
        landlordEmail: r.landlord_email || '',
        landlordPhone: r.landlord_phone || '',
        invoiceNumber: r.invoice_number || `INV-${String(r.id).slice(0, 8).toUpperCase()}`,
        items: parsedItems,
        billingPeriodStart: safeFormatDate(r.billing_period_start),
        billingPeriodEnd: safeFormatDate(r.billing_period_end),
        createdAt: r.created_at,
      };
    });

    res.json(receipts);
  } catch (error) {
    console.error('Error fetching landlord receipts:', error);
    res.status(500).json({ error: 'Server error fetching receipts' });
  }
};

// @desc    Sign/stamp a receipt by landlord
// @route   POST /api/rent/receipts/:paymentId/sign
export const signReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const landlordId = req.user.id;
    const fallbackName = `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'Property Owner';
    const signatureName = (req.body?.signatureName || fallbackName).trim();

    // Verify payment belongs to landlord
    const checkQuery = `
      SELECT rp.id, COALESCE(p.landlord_id, ri.landlord_id, l.landlord_id) as landlord_id,
             rp.signed_by, rp.signed_at
      FROM rent_payments rp
      LEFT JOIN rent_invoices ri ON rp.invoice_id = ri.id
      LEFT JOIN leases l ON (rp.lease_id = l.id OR ri.lease_id = l.id)
      LEFT JOIN properties p ON (rp.property_id = p.id OR ri.property_id = p.id OR l.property_id = p.id)
      WHERE rp.id = $1
    `;
    const checkRes = await pool.query(checkQuery, [paymentId]);
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: 'Receipt payment record not found' });
    }

    const row = checkRes.rows[0];
    if (row.landlord_id !== landlordId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to sign this receipt' });
    }

    // Update payment record with signed_by and signed_at
    const updateRes = await pool.query(
      `UPDATE rent_payments
       SET signed_by = $1, signed_at = NOW()
       WHERE id = $2
       RETURNING id, signed_by, signed_at, sent_at`,
      [signatureName, paymentId]
    );

    const updated = updateRes.rows[0];
    res.json({
      success: true,
      message: 'Receipt signed successfully',
      signedBy: updated.signed_by,
      signedAt: updated.signed_at,
      status: updated.sent_at ? 'sent' : 'signed',
    });
  } catch (error) {
    console.error('Error signing receipt:', error);
    res.status(500).json({ error: 'Server error signing receipt' });
  }
};

// @desc    Send receipt copy to tenant (idempotent, sends email & in-app notification)
// @route   POST /api/rent/receipts/:paymentId/send
export const sendReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const landlordId = req.user.id;

    // Fetch full receipt details with tenant and property
    const checkQuery = `
      SELECT 
        rp.id as payment_id,
        rp.amount,
        COALESCE(rp.payment_date::text, ri.paid_at::text, rp.created_at::text) as payment_date,
        COALESCE(rp.payment_method, ri.payment_method, ri.bank_name, 'Paystack') as payment_method,
        COALESCE(rp.reference_number, ri.payment_reference, 'N/A') as reference_number,
        rp.signed_by,
        rp.signed_at,
        rp.sent_at,
        rp.receipt_number,
        COALESCE(rp.tenant_id, ri.tenant_id, l.tenant_id) as tenant_id,
        COALESCE(ri.landlord_id, p.landlord_id, l.landlord_id) as landlord_id,
        p.title as property_title,
        tu.first_name || ' ' || tu.last_name as tenant_name,
        tu.email as tenant_email,
        lu.first_name || ' ' || lu.last_name as landlord_name
      FROM rent_payments rp
      LEFT JOIN rent_invoices ri ON rp.invoice_id = ri.id
      LEFT JOIN leases l ON (rp.lease_id = l.id OR ri.lease_id = l.id)
      LEFT JOIN properties p ON (rp.property_id = p.id OR ri.property_id = p.id OR l.property_id = p.id)
      LEFT JOIN users tu ON (rp.tenant_id = tu.id OR ri.tenant_id = tu.id OR l.tenant_id = tu.id)
      LEFT JOIN users lu ON (p.landlord_id = lu.id OR ri.landlord_id = lu.id OR l.landlord_id = lu.id)
      WHERE rp.id = $1
    `;
    const checkRes = await pool.query(checkQuery, [paymentId]);
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: 'Receipt payment record not found' });
    }

    const r = checkRes.rows[0];
    if (r.landlord_id !== landlordId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to send this receipt' });
    }

    const previousSentAt = r.sent_at;
    const receiptNum =
      r.receipt_number ||
      (r.reference_number && r.reference_number !== 'N/A' && r.reference_number.length >= 6
        ? `LOD-REC-${r.reference_number.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '')}`
        : `LOD-REC-${String(r.payment_id).slice(0, 8).toUpperCase()}`);

    // Update sent_at (idempotent: keeps existing sent_at if already set)
    const updateRes = await pool.query(
      `UPDATE rent_payments
       SET sent_at = COALESCE(sent_at, NOW())
       WHERE id = $1
       RETURNING sent_at`,
      [paymentId]
    );
    const sentAt = updateRes.rows[0].sent_at;

    // 1. Create in-app notification for tenant if tenant_id exists
    if (r.tenant_id) {
      const formattedAmt = Number(r.amount || 0).toLocaleString();
      const notifMsg = `Your landlord has issued an official receipt for rent payment of NGN ${formattedAmt} on ${r.property_title || 'your property'}. Reference: ${r.reference_number || 'N/A'}.`;
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, $3, 'receipt', 'rent_payment', $4)`,
        [r.tenant_id, 'Rent Receipt Issued', notifMsg, paymentId]
      );
    }

    // 2. Dispatch email via Resend if configured (or log to console in dev)
    let emailSent = false;
    let emailMode = 'none';
    if (r.tenant_email) {
      try {
        const emailRes = await sendReceiptEmail({
          to: r.tenant_email,
          tenantName: (r.tenant_name || '').trim(),
          landlordName: (r.landlord_name || '').trim(),
          propertyTitle: r.property_title || 'Rental Property',
          amount: r.amount,
          paymentDate: safeFormatDate(r.payment_date),
          paymentMethod: r.payment_method || 'Paystack',
          reference: r.reference_number,
          receiptNumber: receiptNum,
          signedBy: r.signed_by,
          signedAt: r.signed_at,
        });
        emailSent = isEmailEnabled();
        emailMode = emailRes.mode;
      } catch (emailErr) {
        console.warn('[sendReceipt] Email sending notice:', emailErr.message);
      }
    }

    res.json({
      success: true,
      message: previousSentAt ? 'Receipt re-sent to tenant' : 'Receipt sent to tenant successfully',
      alreadySent: Boolean(previousSentAt),
      sentAt,
      emailSent,
      emailMode,
      status: 'sent',
    });
  } catch (error) {
    console.error('Error sending receipt to tenant:', error);
    res.status(500).json({ error: 'Server error sending receipt to tenant' });
  }
};

