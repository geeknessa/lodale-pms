import { pool } from '../db/db.js';

// @desc    Create a maintenance request (tenant only)
// @route   POST /api/maintenance
export const createRequest = async (req, res) => {
  try {
    const propertyId = req.body.propertyId || req.body.property_id;
    const title = req.body.title || req.body.issue_title;
    const description = req.body.description;
    const priority = req.body.priority || 'medium';
    const tenant_handled = req.body.tenant_handled || false;
    const cost = req.body.cost;
    const tenantId = req.user.id;

    // Verify tenant has a lease or valid tenancy for this property
    const leaseCheck = await pool.query(
      "SELECT id FROM leases WHERE property_id = $1 AND tenant_id = $2 AND status::text IN ('active', 'leased', 'signed', 'draft')",
      [propertyId, tenantId]
    );

    const leaseId = leaseCheck.rowCount > 0 ? leaseCheck.rows[0].id : null;

    if (leaseCheck.rowCount === 0) {
      // Also allow if tenant has an approved application
      const appCheck = await pool.query(
        "SELECT id FROM property_applications WHERE property_id = $1 AND tenant_id = $2 AND status::text IN ('approved', 'invoice_sent', 'payment_submitted', 'rent_paid', 'leased')",
        [propertyId, tenantId]
      );
      if (appCheck.rowCount === 0) {
        return res.status(403).json({ error: 'Unauthorized: You do not have an active tenancy or approved application for this property' });
      }
    }

    const initialStatus = tenant_handled ? 'resolved' : 'pending';

    const { rows } = await pool.query(
      `INSERT INTO maintenance_requests (property_id, lease_id, reported_by, tenant_id, title, description, priority, status, tenant_handled, actual_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        propertyId,
        leaseId,
        tenantId,
        tenantId,
        title,
        description,
        priority || 'medium',
        initialStatus,
        tenant_handled || false,
        cost ? parseFloat(cost) : 0
      ]
    );

    const createdRequest = rows[0];

    // Create real notification in database for the property landlord
    try {
      const propInfo = await pool.query(
        `SELECT p.landlord_id, p.title as property_title, u.first_name, u.last_name, u.email
         FROM properties p
         JOIN users u ON u.id = $1
         WHERE p.id = $2`,
        [tenantId, propertyId]
      );
      if (propInfo.rows.length > 0) {
        const { landlord_id, property_title, first_name, last_name, email } = propInfo.rows[0];
        const tenantName = `${first_name || ''} ${last_name || ''}`.trim() || email || 'Tenant';
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            landlord_id,
            'New Maintenance Request',
            `${tenantName} submitted a maintenance request for "${property_title}": "${title}".`,
            'maintenance',
            'maintenance',
            createdRequest.id
          ]
        );
      }
    } catch (notifErr) {
      console.warn('Could not insert maintenance notification for landlord:', notifErr.message);
    }

    res.status(201).json(createdRequest);
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    res.status(500).json({ error: 'Server error creating maintenance request' });
  }
};

// @desc    Get all maintenance requests for current user
// @route   GET /api/maintenance
export const getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role || req.user.primary_role;

    let query = '';
    let params = [userId];

    if (role === 'landlord' || role === 'admin') {
      query = `
        SELECT mr.*, p.title as property_title, 
               u.first_name || ' ' || u.last_name as tenant_name,
               u.email as tenant_email
        FROM maintenance_requests mr
        JOIN properties p ON mr.property_id = p.id
        JOIN users u ON mr.tenant_id = u.id
        WHERE p.landlord_id = $1
        ORDER BY mr.created_at DESC
      `;
    } else {
      query = `
        SELECT mr.*, p.title as property_title,
               ld.first_name || ' ' || ld.last_name as landlord_name
        FROM maintenance_requests mr
        JOIN properties p ON mr.property_id = p.id
        JOIN users ld ON p.landlord_id = ld.id
        WHERE mr.tenant_id = $1
        ORDER BY mr.created_at DESC
      `;
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ error: 'Server error fetching maintenance requests' });
  }
};

// @desc    Update status of a maintenance request (landlord only)
// @route   PATCH /api/maintenance/:id
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, cost } = req.body;
    const landlordId = req.user.id;

    // Verify request belongs to landlord's property
    const checkRes = await pool.query(
      `SELECT mr.id, mr.title, mr.tenant_id, p.title as property_title
       FROM maintenance_requests mr
       JOIN properties p ON mr.property_id = p.id
       WHERE mr.id = $1 AND p.landlord_id = $2`,
      [id, landlordId]
    );

    if (checkRes.rowCount === 0) {
      return res.status(403).json({ error: 'Unauthorized: Maintenance request not found or does not belong to your property' });
    }

    const statusMap = {
      pending: 'pending',
      open: 'pending',
      'in progress': 'in_progress',
      in_progress: 'in_progress',
      acknowledged: 'in_progress',
      completed: 'resolved',
      resolved: 'resolved',
      closed: 'resolved',
      cancelled: 'cancelled'
    };
    const dbStatus = statusMap[status?.toLowerCase()] || 'pending';

    const { rows } = await pool.query(
      `UPDATE maintenance_requests 
       SET status = $1, notes = COALESCE($2, notes), actual_cost = COALESCE($3, actual_cost), updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [dbStatus, notes || null, cost !== undefined && cost !== null && cost !== '' ? parseFloat(cost) : null, id]
    );

    // Notify the tenant of status update
    try {
      const { title: reqTitle, tenant_id, property_title } = checkRes.rows[0];
      const displayStatus = dbStatus.replace('_', ' ');
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          tenant_id,
          'Maintenance Request Update',
          `Your maintenance request "${reqTitle}" for "${property_title}" is now marked as ${displayStatus}.`,
          'maintenance',
          'maintenance',
          id
        ]
      );
    } catch (notifErr) {
      console.warn('Could not insert maintenance notification for tenant:', notifErr.message);
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    res.status(500).json({ error: 'Server error updating maintenance request' });
  }
};
