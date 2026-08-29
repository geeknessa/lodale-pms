import { pool } from '../db/db.js';

export const generateLease = async (req, res) => {
  try {
    const { 
      propertyId, 
      tenantId, 
      applicationId, 
      startDate, 
      endDate, 
      rentAmount, 
      rentPeriod, 
      securityDeposit,
      customClauses,
      includePets,
      includeSmoking,
      includeLateFee
    } = req.body;
    const landlordId = req.user.id; // from authMiddleware

    // Basic validation
    if (!propertyId || !tenantId || !startDate || !endDate || !rentAmount || !rentPeriod) {
      return res.status(400).json({ error: 'Missing required lease fields' });
    }

    // Verify landlord owns the property
    const propertyCheck = await pool.query('SELECT id FROM properties WHERE id = $1 AND landlord_id = $2', [propertyId, landlordId]);
    if (propertyCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Unauthorized or property not found' });
    }

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create lease (automatically pre-signed by generating landlord)
      const insertLease = `
        INSERT INTO leases (
          property_id, tenant_id, landlord_id, application_id, 
          start_date, end_date, rent_amount, rent_period, security_deposit,
          custom_clauses, include_pets, include_smoking, include_late_fee,
          status, landlord_signed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft', NOW())
        RETURNING *;
      `;
      const leaseRes = await client.query(insertLease, [
        propertyId, tenantId, landlordId, applicationId || null,
        startDate, endDate, rentAmount, rentPeriod, securityDeposit || 0,
        customClauses || null, includePets || false, includeSmoking || false, includeLateFee || false
      ]);

      // If tied to an application, update application status
      if (applicationId) {
        await client.query("UPDATE property_applications SET status = 'approved' WHERE id = $1", [applicationId]);
      }

      await client.query('COMMIT');
      res.status(201).json({ message: 'Lease generated successfully', lease: leaseRes.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error generating lease:', error);
    res.status(500).json({ error: 'Server error generating lease' });
  }
};

export const signLease = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role || req.user.primary_role;
    const ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';

    // Fetch lease
    const leaseRes = await pool.query('SELECT * FROM leases WHERE id = $1', [id]);
    if (leaseRes.rowCount === 0) {
      return res.status(404).json({ error: 'Lease not found' });
    }
    const lease = leaseRes.rows[0];

    // Check authorization
    if (lease.landlord_id !== userId && lease.tenant_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to sign this lease' });
    }

    let updateQuery = '';
    let updateParams = [];

    if (lease.landlord_id === userId) {
      if (lease.landlord_signed_at) return res.status(400).json({ error: 'Already signed by landlord' });
      updateQuery = 'UPDATE leases SET landlord_signed_at = NOW(), landlord_signature_ip = $1 WHERE id = $2 RETURNING *';
      updateParams = [ip, id];
    } else if (lease.tenant_id === userId) {
      if (lease.tenant_signed_at) return res.status(400).json({ error: 'Already signed by tenant' });
      updateQuery = 'UPDATE leases SET tenant_signed_at = NOW(), tenant_signature_ip = $1 WHERE id = $2 RETURNING *';
      updateParams = [ip, id];
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updatedRes = await client.query(updateQuery, updateParams);
      const updatedLease = updatedRes.rows[0];

      // Check if both signed
      if (updatedLease.landlord_signed_at && updatedLease.tenant_signed_at) {
        // Transition lease status to 'signed' awaiting initial rent payment
        await client.query("UPDATE leases SET status = 'signed' WHERE id = $1", [id]);

        // Update application status to 'approved'
        if (updatedLease.application_id) {
          await client.query("UPDATE property_applications SET status = 'approved' WHERE id = $1", [updatedLease.application_id]);
        }

        // Calculate billing period end date
        const startDate = new Date(updatedLease.start_date);
        const endDate = new Date(startDate);
        if (updatedLease.rent_period === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Generate the first rent invoice (unpaid)
        await client.query(
          `INSERT INTO rent_invoices (lease_id, amount, due_date, status, billing_period_start, billing_period_end)
           VALUES ($1, $2, $3, 'unpaid', $4, $5)`,
          [
            id,
            updatedLease.rent_amount,
            updatedLease.start_date,
            updatedLease.start_date,
            endDate.toISOString().split('T')[0]
          ]
        );
      }

      await client.query('COMMIT');
      
      const finalLeaseRes = await pool.query('SELECT * FROM leases WHERE id = $1', [id]);
      res.json({ message: 'Lease signed successfully', lease: finalLeaseRes.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error signing lease:', error);
    res.status(500).json({ error: 'Server error signing lease' });
  }
};

export const getMyLeases = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role || req.user.primary_role;
    
    let query = '';
    let params = [userId];

    if (role === 'landlord' || role === 'admin') {
      query = `
        SELECT l.*, 
               p.title as property_title, p.address_line1 as property_address, p.state as property_location, p.city as property_city,
               t.first_name || ' ' || t.last_name as tenant_name, t.email as tenant_email
        FROM leases l
        JOIN properties p ON l.property_id = p.id
        JOIN users t ON l.tenant_id = t.id
        WHERE l.landlord_id = $1
        ORDER BY l.created_at DESC
      `;
    } else {
      query = `
        SELECT l.*, 
               p.title as property_title, p.address_line1 as property_address, p.state as property_location, p.city as property_city,
               ld.first_name || ' ' || ld.last_name as landlord_name, ld.email as landlord_email
        FROM leases l
        JOIN properties p ON l.property_id = p.id
        JOIN users ld ON l.landlord_id = ld.id
        WHERE l.tenant_id = $1
        ORDER BY l.created_at DESC
      `;
    }

    const leases = await pool.query(query, params);
    res.json({ leases: leases.rows });
  } catch (error) {
    console.error('Error fetching leases:', error);
    res.status(500).json({ error: 'Server error fetching leases' });
  }
};

export const getLeaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const leaseRes = await pool.query(`
      SELECT l.*, 
             p.title as property_title, p.address_line1 as property_address, p.city as property_city,
             t.first_name || ' ' || t.last_name as tenant_name, t.email as tenant_email,
             ld.first_name || ' ' || ld.last_name as landlord_name, ld.email as landlord_email
      FROM leases l
      JOIN properties p ON l.property_id = p.id
      JOIN users t ON l.tenant_id = t.id
      JOIN users ld ON l.landlord_id = ld.id
      WHERE l.id = $1
    `, [id]);

    if (leaseRes.rowCount === 0) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    const lease = leaseRes.rows[0];
    
    // Auth check
    if (lease.landlord_id !== userId && lease.tenant_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view this lease' });
    }

    res.json({ lease });
  } catch (error) {
    console.error('Error fetching lease:', error);
    res.status(500).json({ error: 'Server error fetching lease' });
  }
};
