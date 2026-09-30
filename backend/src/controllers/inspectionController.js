import { pool } from '../db/db.js';

// @desc    Get all inspections for current user (tenant or landlord)
// @route   GET /api/inspections
// @access  Private
export const getMyInspections = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role || req.user.primary_role;

  try {
    const isLandlord = role === 'landlord' || role === 'admin';
    const query = `
      SELECT i.*, p.title as property_title, 
             u.first_name || ' ' || u.last_name as ${isLandlord ? 'tenant_name' : 'landlord_name'}
      FROM property_inspections i
      JOIN properties p ON i.property_id = p.id
      JOIN users u ON ${isLandlord ? 'i.tenant_id' : 'i.landlord_id'} = u.id
      WHERE ${isLandlord ? 'i.landlord_id' : 'i.tenant_id'} = $1
      ORDER BY i.date DESC
    `;

    const { rows } = await pool.query(query, [userId]);
    res.json(rows);
  } catch (error) {
    console.error('Get inspections error:', error);
    res.status(500).json({ error: 'Server error fetching inspections' });
  }
};

// @desc    Schedule/Create a new inspection
// @route   POST /api/inspections
// @access  Private
export const createInspection = async (req, res) => {
  const { propertyId, applicationId, date, time, location, notes, status } = req.body;
  const role = req.user.role || req.user.primary_role;

  try {
    let tenantId, landlordId;
    const { rows: propRows } = await pool.query('SELECT landlord_id FROM properties WHERE id = $1', [propertyId]);
    if (propRows.length === 0) return res.status(404).json({ error: 'Property not found' });
    
    if (role === 'tenant') {
      tenantId = req.user.id;
      landlordId = propRows[0].landlord_id;
    } else {
      landlordId = req.user.id;
      tenantId = req.body.tenantId; 

      if (propRows[0].landlord_id !== landlordId && role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized: You do not own this property' });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO property_inspections 
       (application_id, property_id, tenant_id, landlord_id, date, time, location, notes, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        applicationId || null, 
        propertyId, 
        tenantId, 
        landlordId, 
        date, 
        time || '10:00 AM', 
        location || 'On-site', 
        notes || '', 
        status || 'Scheduled',
        role || 'landlord'
      ]
    );

    res.status(201).json({ success: true, inspection: rows[0] });
  } catch (error) {
    console.error('Create inspection error:', error);
    res.status(500).json({ error: 'Server error creating inspection' });
  }
};

// @desc    Update inspection status/details
// @route   PATCH /api/inspections/:id
// @access  Private
export const updateInspection = async (req, res) => {
  const { id } = req.params;
  const { status, date, time, notes } = req.body;
  const userId = req.user.id;
  
  try {
    const updates = [];
    const values = [];
    let counter = 1;

    if (status) { updates.push(`status = $${counter++}`); values.push(status); }
    if (date) { updates.push(`date = $${counter++}`); values.push(date); }
    if (time) { updates.push(`time = $${counter++}`); values.push(time); }
    if (notes) { updates.push(`notes = $${counter++}`); values.push(notes); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    
    const { rows } = await pool.query(
      `UPDATE property_inspections 
       SET ${updates.join(', ')} 
       WHERE id = $${counter++} AND (tenant_id = $${counter} OR landlord_id = $${counter})
       RETURNING *`,
      [...values, id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inspection not found or you do not have permission' });
    }

    res.json({ success: true, inspection: rows[0] });
  } catch (error) {
    console.error('Update inspection error:', error);
    res.status(500).json({ error: 'Server error updating inspection' });
  }
};
