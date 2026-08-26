import { pool } from '../db/db.js';

// @desc    Create a maintenance request (tenant only)
// @route   POST /api/maintenance
export const createRequest = async (req, res) => {
  try {
    const { propertyId, title, description, priority } = req.body;
    const tenantId = req.user.id;

    // Verify tenant has an active lease for this property
    const leaseCheck = await pool.query(
      "SELECT id FROM leases WHERE property_id = $1 AND tenant_id = $2 AND status = 'active'",
      [propertyId, tenantId]
    );

    if (leaseCheck.rowCount === 0) {
      return res.status(403).json({ error: 'Unauthorized: You do not have an active lease for this property' });
    }
    
    const leaseId = leaseCheck.rows[0].id;

    const { rows } = await pool.query(
      `INSERT INTO maintenance_requests (property_id, lease_id, reported_by, title, description, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'open')
       RETURNING *`,
      [propertyId, leaseId, tenantId, title, description, priority || 'medium']
    );

    res.status(201).json(rows[0]);
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
        SELECT mr.*, p.title as property_title, u.first_name || ' ' || u.last_name as tenant_name
        FROM maintenance_requests mr
        JOIN properties p ON mr.property_id = p.id
        JOIN users u ON mr.reported_by = u.id
        WHERE p.landlord_id = $1
        ORDER BY mr.created_at DESC
      `;
    } else {
      query = `
        SELECT mr.*, p.title as property_title
        FROM maintenance_requests mr
        JOIN properties p ON mr.property_id = p.id
        WHERE mr.reported_by = $1
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
    const { status, notes } = req.body;
    const landlordId = req.user.id;

    // Verify request belongs to landlord's property
    const checkRes = await pool.query(
      `SELECT mr.id 
       FROM maintenance_requests mr
       JOIN properties p ON mr.property_id = p.id
       WHERE mr.id = $1 AND p.landlord_id = $2`,
      [id, landlordId]
    );

    if (checkRes.rowCount === 0) {
      return res.status(403).json({ error: 'Unauthorized: Maintenance request not found or does not belong to your property' });
    }

    const statusMap = {
      pending: 'open',
      open: 'open',
      'in progress': 'in_progress',
      in_progress: 'in_progress',
      acknowledged: 'acknowledged',
      completed: 'resolved',
      resolved: 'resolved',
      closed: 'closed',
      cancelled: 'cancelled'
    };
    const dbStatus = statusMap[status?.toLowerCase()] || 'open';

    const { rows } = await pool.query(
      `UPDATE maintenance_requests 
       SET status = $1, resolution_notes = COALESCE($2, resolution_notes), updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [dbStatus, notes || null, id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    res.status(500).json({ error: 'Server error updating maintenance request' });
  }
};
