import { pool } from '../db/db.js';

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
        SELECT ri.*, l.property_id, l.tenant_id, p.title as property_title, 
               u.first_name || ' ' || u.last_name as tenant_name
        FROM rent_invoices ri
        JOIN leases l ON ri.lease_id = l.id
        JOIN properties p ON l.property_id = p.id
        JOIN users u ON l.tenant_id = u.id
        WHERE l.landlord_id = $1
        ORDER BY ri.due_date DESC
      `;
    } else {
      query = `
        SELECT ri.*, l.property_id, l.landlord_id, p.title as property_title, 
               u.first_name || ' ' || u.last_name as landlord_name
        FROM rent_invoices ri
        JOIN leases l ON ri.lease_id = l.id
        JOIN properties p ON l.property_id = p.id
        JOIN users u ON l.landlord_id = u.id
        WHERE l.tenant_id = $1
        ORDER BY ri.due_date DESC
      `;
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Server error fetching invoices' });
  }
};

// @desc    Create a custom invoice (landlord only)
// @route   POST /api/rent/invoice
export const createInvoice = async (req, res) => {
  try {
    const { leaseId, amount, dueDate, billingPeriodStart, billingPeriodEnd } = req.body;
    const landlordId = req.user.id;

    // Verify lease belongs to this landlord
    const leaseCheck = await pool.query(
      'SELECT id FROM leases WHERE id = $1 AND landlord_id = $2',
      [leaseId, landlordId]
    );

    if (leaseCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Unauthorized: Lease not found or not managed by you' });
    }

    const { rows } = await pool.query(
      `INSERT INTO rent_invoices (lease_id, amount, due_date, status, billing_period_start, billing_period_end)
       VALUES ($1, $2, $3, 'unpaid', $4, $5)
       RETURNING *`,
      [leaseId, amount, dueDate, billingPeriodStart, billingPeriodEnd]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Server error creating invoice' });
  }
};

// @desc    Record/Simulate payment for an invoice
// @route   POST /api/rent/pay/:invoiceId
export const recordPayment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { invoiceId } = req.params;
    const { paymentMethod, referenceNumber, notes, amount } = req.body;
    const userId = req.user.id;
    const role = req.user.role || req.user.primary_role;

    await client.query('BEGIN');

    // Fetch invoice and verify auth
    const invoiceRes = await client.query(
      `SELECT ri.*, l.tenant_id, l.landlord_id, l.rent_amount 
       FROM rent_invoices ri
       JOIN leases l ON ri.lease_id = l.id
       WHERE ri.id = $1`,
      [invoiceId]
    );

    if (invoiceRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceRes.rows[0];

    // Authorize: Tenant paying their invoice OR Landlord recording a manual payment
    if (role === 'tenant' && invoice.tenant_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized: This is not your invoice' });
    }
    if (role === 'landlord' && invoice.landlord_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized: This invoice does not belong to your property' });
    }

    const payAmount = amount || invoice.amount;

    // Record the payment
    const paymentRes = await client.query(
      `INSERT INTO rent_payments (invoice_id, lease_id, amount, payment_method, reference_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [invoiceId, invoice.lease_id, payAmount, paymentMethod || 'simulated', referenceNumber || null, notes || '']
    );

    // Update invoice status to paid
    await client.query(
      "UPDATE rent_invoices SET status = 'paid', updated_at = NOW() WHERE id = $1",
      [invoiceId]
    );

    // Fetch parent lease to check if payment activates an initial lease
    const leaseRes = await client.query(
      `SELECT l.*, u.first_name || ' ' || u.last_name as tenant_name
       FROM leases l
       JOIN users u ON l.tenant_id = u.id
       WHERE l.id = $1`,
      [invoice.lease_id]
    );

    if (leaseRes.rowCount > 0) {
      const targetLease = leaseRes.rows[0];
      // If lease is signed but not active yet, payment activates the tenancy!
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

    await client.query('COMMIT');

    res.json({
      message: 'Payment recorded successfully',
      payment: paymentRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Server error recording payment' });
  } finally {
    client.release();
  }
};
