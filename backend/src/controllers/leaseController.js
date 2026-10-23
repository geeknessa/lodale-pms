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
      return res.status(400).json({ 
        error: 'Missing required lease fields: propertyId, tenantId, startDate, endDate, rentAmount, and rentPeriod are required' 
      });
    }

    // User-chosen dates validation: real dates, end date after start date
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return res.status(400).json({ error: 'Lease start and end dates must be valid dates' });
    }
    if (parsedEnd <= parsedStart) {
      return res.status(400).json({ error: 'Lease end date must be after lease start date' });
    }

    // Verify landlord owns the property (or is admin)
    const role = req.user.role || req.user.primary_role;
    let propertyCheck;
    if (role === 'admin') {
      propertyCheck = await pool.query('SELECT id, landlord_id FROM properties WHERE id = $1', [propertyId]);
    } else {
      propertyCheck = await pool.query('SELECT id, landlord_id FROM properties WHERE id = $1 AND landlord_id = $2', [propertyId, landlordId]);
    }
    if (propertyCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Unauthorized: Property not found or you do not have permission to lease this property' });
    }
    const effectiveLandlordId = propertyCheck.rows[0].landlord_id || landlordId;

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Resolve application ID (from body or active application matching property & tenant)
      let effectiveAppId = applicationId || null;
      if (!effectiveAppId && propertyId && tenantId) {
        const findApp = await client.query(
          `SELECT id, status FROM property_applications 
           WHERE property_id = $1 AND tenant_id = $2 
           ORDER BY created_at DESC LIMIT 1`,
          [propertyId, tenantId]
        );
        if (findApp.rowCount > 0) {
          effectiveAppId = findApp.rows[0].id;
        }
      }

      // Enforce application status must be rent_paid before generate
      if (!effectiveAppId) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'An active application with confirmed rent payment (rent_paid) is required to generate a lease agreement.' 
        });
      }

      const appRes = await client.query(
        'SELECT id, status, property_id, tenant_id FROM property_applications WHERE id = $1',
        [effectiveAppId]
      );
      if (appRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Associated application (${effectiveAppId}) was not found` });
      }
      const app = appRes.rows[0];
      const normalizedStatus = (app.status || '').toLowerCase();
      if (normalizedStatus !== 'rent_paid' && normalizedStatus !== 'lease_sent') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Cannot issue lease agreement until rent payment has been confirmed (application status is "${app.status}", required: "rent_paid")`,
          currentStatus: app.status,
          requiredStatus: 'rent_paid'
        });
      }

      // Check if a lease already exists for this application (or property + tenant draft)
      let existingLease = null;
      if (effectiveAppId) {
        const findLease = await client.query(
          'SELECT id, status FROM leases WHERE application_id = $1 LIMIT 1',
          [effectiveAppId]
        );
        if (findLease.rowCount > 0) {
          existingLease = findLease.rows[0];
        }
      }

      let leaseRes;
      if (existingLease) {
        // Update the existing lease draft
        const updateLeaseSql = `
          UPDATE leases SET
            property_id = $1,
            tenant_id = $2,
            landlord_id = $3,
            start_date = $4,
            end_date = $5,
            rent_amount = $6,
            rent_period = $7,
            security_deposit = $8,
            custom_clauses = $9,
            include_pets = $10,
            include_smoking = $11,
            include_late_fee = $12,
            status = CASE WHEN status = 'active' THEN status ELSE 'partially_signed' END,
            landlord_signed_at = NOW(),
            updated_at = NOW()
          WHERE id = $13
          RETURNING *;
        `;
        leaseRes = await client.query(updateLeaseSql, [
          propertyId, tenantId, effectiveLandlordId,
          startDate, endDate, rentAmount, rentPeriod, securityDeposit || 0,
          customClauses || null, includePets || false, includeSmoking || false, includeLateFee || false,
          existingLease.id
        ]);
      } else {
        // Create new lease (pre-signed by landlord)
        const insertLease = `
          INSERT INTO leases (
            property_id, tenant_id, landlord_id, application_id, 
            start_date, end_date, rent_amount, rent_period, security_deposit,
            custom_clauses, include_pets, include_smoking, include_late_fee,
            status, landlord_signed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'partially_signed', NOW())
          RETURNING *;
        `;
        leaseRes = await client.query(insertLease, [
          propertyId, tenantId, effectiveLandlordId, effectiveAppId || null,
          startDate, endDate, rentAmount, rentPeriod, securityDeposit || 0,
          customClauses || null, includePets || false, includeSmoking || false, includeLateFee || false
        ]);
      }

      const createdLease = leaseRes.rows[0];

      // On success set application.status = lease_sent and link lease_id
      if (effectiveAppId) {
        await client.query(
          "UPDATE property_applications SET status = 'lease_sent', lease_id = $1, updated_at = NOW() WHERE id = $2",
          [createdLease.id, effectiveAppId]
        );
      }

      await client.query('COMMIT');

      // Notify the tenant about the new lease agreement
      try {
        const propRes = await pool.query('SELECT title FROM properties WHERE id = $1', [propertyId]);
        const propTitle = propRes.rows[0]?.title || 'Property';
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            tenantId,
            'New Lease Agreement Ready',
            `A new lease agreement for "${propTitle}" has been prepared and signed by the landlord. Please review and sign.`,
            'lease',
            'lease',
            createdLease.id
          ]
        );
      } catch (notifErr) {
        console.warn('Failed to notify tenant of generated lease:', notifErr.message);
      }

      res.status(201).json({ 
        message: 'Lease generated successfully and sent to tenant', 
        lease: createdLease,
        applicationStatus: 'lease_sent'
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error in generateLease transaction:', err);
      return res.status(err.status || 400).json({ 
        error: err.message || 'Failed to generate lease agreement' 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error generating lease:', error);
    const isServerError = !error.status || error.status >= 500;
    const errorMsg = isServerError ? 'Server error generating lease' : (error.message || 'Error generating lease');
    res.status(error.status || 500).json({ 
      error: errorMsg,
      ...(process.env.NODE_ENV === 'development' && isServerError ? { details: error.message } : {})
    });
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
        // Transition lease status to 'fully_signed'
        await client.query("UPDATE leases SET status = 'fully_signed', updated_at = NOW() WHERE id = $1", [id]);

        // Update application status to 'lease_signed'
        if (updatedLease.application_id) {
          await client.query("UPDATE property_applications SET status = 'lease_signed', updated_at = NOW() WHERE id = $1", [updatedLease.application_id]);
        } else {
          // For standalone leases without an application, generate first invoice if none exists
          const invCheck = await client.query("SELECT id FROM rent_invoices WHERE lease_id = $1", [id]);
          if (invCheck.rowCount === 0) {
            const startDate = new Date(updatedLease.start_date);
            const endDate = new Date(startDate);
            if (updatedLease.rent_period === 'monthly') {
              endDate.setMonth(endDate.getMonth() + 1);
            } else {
              endDate.setFullYear(endDate.getFullYear() + 1);
            }

            await client.query(
              `INSERT INTO rent_invoices (lease_id, property_id, tenant_id, landlord_id, amount, due_date, status, billing_period_start, billing_period_end)
               VALUES ($1, $2, $3, $4, $5, $6, 'unpaid', $7, $8)`,
              [
                id,
                updatedLease.property_id,
                updatedLease.tenant_id,
                updatedLease.landlord_id,
                updatedLease.rent_amount,
                updatedLease.start_date,
                updatedLease.start_date,
                endDate.toISOString().split('T')[0]
              ]
            );
          }
        }
      } else {
        await client.query("UPDATE leases SET status = 'partially_signed', updated_at = NOW() WHERE id = $1", [id]);
      }

      await client.query('COMMIT');
      
      const finalLeaseRes = await pool.query('SELECT * FROM leases WHERE id = $1', [id]);
      const currentLease = finalLeaseRes.rows[0];

      // Send real database notifications based on who signed
      try {
        const propRes = await pool.query('SELECT title FROM properties WHERE id = $1', [currentLease.property_id]);
        const propTitle = propRes.rows[0]?.title || 'Property';

        if (currentLease.landlord_signed_at && currentLease.tenant_signed_at) {
          // Tenancy finalized: notify both
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
             VALUES ($1, $2, $3, $4, $5, $6), ($7, $8, $9, $10, $11, $12)`,
            [
              currentLease.tenant_id,
              'Lease Agreement Finalized',
              `Your lease for "${propTitle}" is fully executed! Landlord will complete move-in onboarding next.`,
              'success',
              'lease',
              id,
              currentLease.landlord_id,
              'Lease Agreement Finalized',
              `Lease agreement for "${propTitle}" has been signed by all parties. Ready to complete move-in.`,
              'success',
              'lease',
              id
            ]
          );
        } else if (role === 'tenant' || userId === currentLease.tenant_id) {
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              currentLease.landlord_id,
              'Lease Signed by Tenant',
              `Tenant has signed the lease agreement for "${propTitle}".`,
              'lease',
              'lease',
              id
            ]
          );
        } else {
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              currentLease.tenant_id,
              'Lease Signed by Landlord',
              `Landlord has signed the lease agreement for "${propTitle}".`,
              'lease',
              'lease',
              id
            ]
          );
        }
      } catch (notifErr) {
        console.warn('Failed to dispatch lease signing notification:', notifErr.message);
      }

      res.json({ message: 'Lease signed successfully', lease: currentLease });
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
               p.title as property_title, p.address_line1 as property_address, p.city as property_city, p.state as property_state, p.state as property_location,
               COALESCE(NULLIF(TRIM(p.address_line1), ''), '') || 
               CASE WHEN p.city IS NOT NULL AND TRIM(p.city) != '' THEN ', ' || TRIM(p.city) ELSE '' END || 
               CASE WHEN p.state IS NOT NULL AND TRIM(p.state) != '' THEN ', ' || TRIM(p.state) ELSE '' END as property_full_address,
               p.property_type, p.bedrooms, p.bathrooms, p.cover_image, p.images as property_images,
               t.first_name || ' ' || t.last_name as tenant_name, t.email as tenant_email,
               t.avatar_url as tenant_avatar
        FROM leases l
        JOIN properties p ON l.property_id = p.id
        JOIN users t ON l.tenant_id = t.id
        WHERE l.landlord_id = $1
        ORDER BY l.created_at DESC
      `;
    } else {
      query = `
        SELECT l.*, 
               p.title as property_title, p.address_line1 as property_address, p.city as property_city, p.state as property_state, p.state as property_location,
               COALESCE(NULLIF(TRIM(p.address_line1), ''), '') || 
               CASE WHEN p.city IS NOT NULL AND TRIM(p.city) != '' THEN ', ' || TRIM(p.city) ELSE '' END || 
               CASE WHEN p.state IS NOT NULL AND TRIM(p.state) != '' THEN ', ' || TRIM(p.state) ELSE '' END as property_full_address,
               p.property_type, p.bedrooms, p.bathrooms, p.cover_image, p.images as property_images,
               ld.first_name || ' ' || ld.last_name as landlord_name, ld.email as landlord_email,
               ld.avatar_url as landlord_avatar
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
             p.title as property_title, p.address_line1 as property_address, p.city as property_city, p.state as property_state,
             COALESCE(NULLIF(TRIM(p.address_line1), ''), '') || 
             CASE WHEN p.city IS NOT NULL AND TRIM(p.city) != '' THEN ', ' || TRIM(p.city) ELSE '' END || 
             CASE WHEN p.state IS NOT NULL AND TRIM(p.state) != '' THEN ', ' || TRIM(p.state) ELSE '' END as property_full_address,
             p.property_type, p.bedrooms, p.bathrooms, p.cover_image, p.images as property_images,
             t.first_name || ' ' || t.last_name as tenant_name, t.email as tenant_email,
             t.avatar_url as tenant_avatar,
             ld.first_name || ' ' || ld.last_name as landlord_name, ld.email as landlord_email,
             ld.avatar_url as landlord_avatar
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
    const role = req.user.role || req.user.primary_role;
    
    // Auth check: must be landlord, tenant or admin
    if (role !== 'admin' && lease.landlord_id !== userId && lease.tenant_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view this lease' });
    }

    res.json({ lease });
  } catch (error) {
    console.error('Error fetching lease:', error);
    res.status(500).json({ error: 'Server error fetching lease' });
  }
};

export const updateLeaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const role = req.user.role || req.user.primary_role;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const leaseRes = await pool.query('SELECT * FROM leases WHERE id = $1', [id]);
    if (leaseRes.rowCount === 0) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    const lease = leaseRes.rows[0];

    // Auth check: landlord of this lease or admin can end/update the lease status
    if (role !== 'admin' && lease.landlord_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to modify this lease' });
    }

    const updated = await pool.query(
      'UPDATE leases SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json({ message: 'Lease status updated', lease: updated.rows[0] });
  } catch (error) {
    console.error('Error updating lease status:', error);
    res.status(500).json({ error: 'Server error updating lease' });
  }
};
