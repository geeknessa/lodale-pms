import { pool } from '../db/db.js';

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
    propertyTitle: ri.property_title || '',
    property_title: ri.property_title || '',
    tenantName: ri.tenant_name || '',
    landlordName: ri.landlord_name || '',
    landlordEmail: ri.landlord_email || '',
    landlordPhone: ri.landlord_phone || '',
    landlordAddress: ri.landlord_address || '',
    tenantEmail: ri.tenant_email || '',
    tenantPhone: ri.tenant_phone || '',
    tenantAddress: ri.tenant_address || ''
  };
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
      note
    } = req.body;

    const totalPayable = Number(grandTotal || amount || 0);
    const invoiceSubtotal = Number(subtotal || amount || totalPayable);
    const invoiceLodaleFee = Number(lodaleFee || Math.round(invoiceSubtotal * 0.01));
    const invNotes = notes || note || '';
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

      // Transition application status to 'invoice_sent'
      await client.query(
        "UPDATE property_applications SET status = 'invoice_sent', updated_at = NOW() WHERE id = $1",
        [applicationId]
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

    // Case 2: Lease-based Invoice
    if (leaseId) {
      const leaseCheck = await client.query(
        `SELECT l.id, l.property_id, l.tenant_id, p.title as property_title
         FROM leases l
         JOIN properties p ON l.property_id = p.id
         WHERE l.id = $1 AND l.landlord_id = $2`,
        [leaseId, landlordId]
      );

      if (leaseCheck.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Unauthorized: Lease not found or not managed by you' });
      }

      const leaseData = leaseCheck.rows[0];
      propertyId = leaseData.property_id;
      tenantId = leaseData.tenant_id;
      propertyTitle = leaseData.property_title;

      const generatedNum = invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
      const { rows } = await client.query(
        `INSERT INTO rent_invoices (
           lease_id, property_id, tenant_id, landlord_id,
           invoice_number, amount, subtotal, lodale_fee, grand_total,
           due_date, issue_date, status, bank_name, bank_account_number, bank_account_name,
           items, notes, billing_period_start, billing_period_end
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'unpaid', $12, $13, $14, $15, $16, $17, $18)
         RETURNING *`,
        [
          leaseId,
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
          invNotes,
          invIssueDate,
          invDueDate
        ]
      );

      const createdInvoice = rows[0];

      // Notify tenant
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          tenantId,
          'New Rent Invoice Issued',
          `A rent invoice of ₦${Number(totalPayable).toLocaleString()} has been issued for "${propertyTitle}" (Due: ${invDueDate}).`,
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
    res.status(500).json({ error: error.message || 'Server error creating invoice' });
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
      amount,
      applicationId 
    } = req.body;

    const userId = req.user.id;
    const role = req.user.role || req.user.primary_role;
    const effectiveReference = (paymentReference || referenceNumber || reference || '').trim();

    await client.query('BEGIN');

    // Fetch invoice: can match by invoice id OR by application_id
    const invoiceRes = await client.query(
      `SELECT ri.*, 
              COALESCE(ri.property_id, l.property_id, a.property_id) as property_id,
              COALESCE(ri.tenant_id, l.tenant_id, a.tenant_id) as tenant_id,
              COALESCE(ri.landlord_id, l.landlord_id, p.landlord_id) as landlord_id,
              p.title as property_title
       FROM rent_invoices ri
       LEFT JOIN leases l ON ri.lease_id = l.id
       LEFT JOIN property_applications a ON ri.application_id = a.id
       LEFT JOIN properties p ON (ri.property_id = p.id OR l.property_id = p.id OR a.property_id = p.id)
       WHERE ri.id::text = $1 OR ri.application_id::text = $1`,
      [invoiceId]
    );

    if (invoiceRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceRes.rows[0];

    // Authorization
    if (role === 'tenant' && invoice.tenant_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized: This is not your invoice' });
    }
    if (role === 'landlord' && invoice.landlord_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized: This invoice does not belong to your property' });
    }

    const isVerification = (paymentMethod === 'Verified by Landlord' || role === 'landlord');
    const payAmount = amount || invoice.grand_total || invoice.amount;

    if (role === 'tenant' && !isVerification) {
      // Tenant submitting payment reference / proof
      await client.query(
        `UPDATE rent_invoices 
         SET payment_reference = $1,
             payment_proof_url = COALESCE($2, payment_proof_url),
             updated_at = NOW()
         WHERE id = $3`,
        [effectiveReference, paymentProofUrl || null, invoice.id]
      );

      // If application attached, advance status to payment_submitted
      if (invoice.application_id) {
        await client.query(
          "UPDATE property_applications SET status = 'payment_submitted', updated_at = NOW() WHERE id = $1",
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

    // Landlord verifying or full payment confirmation
    const paymentRes = await client.query(
      `INSERT INTO rent_payments (invoice_id, lease_id, application_id, property_id, tenant_id, amount, payment_date, payment_method, reference_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, $8, $9)
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
        notes || 'Verified by Landlord'
      ]
    );

    // Update invoice status to paid
    await client.query(
      "UPDATE rent_invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = $1",
      [invoice.id]
    );

    // If attached to application, update status to rent_paid
    if (invoice.application_id) {
      await client.query(
        "UPDATE property_applications SET status = 'rent_paid', updated_at = NOW() WHERE id = $1",
        [invoice.application_id]
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
          if (targetLease.application_id) {
            await client.query("UPDATE property_applications SET status = 'leased', updated_at = NOW() WHERE id = $1", [targetLease.application_id]);
          }
        }
      }
    }

    await client.query('COMMIT');

    // Notify tenant of confirmed payment
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          invoice.tenant_id,
          'Payment Confirmed',
          `Your payment of ₦${Number(payAmount).toLocaleString()} for "${invoice.property_title}" has been verified and confirmed by the landlord.`,
          'payment',
          'invoice',
          invoice.id
        ]
      );
    } catch (notifErr) {
      console.warn('Failed to dispatch payment confirmation notification:', notifErr.message);
    }

    res.json({
      message: 'Payment recorded and confirmed successfully',
      payment: paymentRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording payment:', error);
    res.status(500).json({ error: error.message || 'Server error recording payment' });
  } finally {
    client.release();
  }
};
