import { pool } from '../db/db.js';

// @desc    Get all inspections for current user (tenant or landlord)
// @route   GET /api/inspections
// @access  Private
export const getMyInspections = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role || req.user.primary_role;

  try {
    const query = `
      SELECT i.*, 
             i.property_id as "propertyId",
             i.tenant_id as "tenantId",
             i.landlord_id as "landlordId",
             i.application_id as "applicationId",
             p.title as property_title, 
             p.title as "propertyTitle",
             tu.first_name || ' ' || tu.last_name as tenant_name,
             tu.first_name || ' ' || tu.last_name as "tenantName",
             lu.first_name || ' ' || lu.last_name as landlord_name,
             lu.first_name || ' ' || lu.last_name as "landlordName"
      FROM property_inspections i
      JOIN properties p ON i.property_id = p.id
      JOIN users tu ON i.tenant_id = tu.id
      JOIN users lu ON i.landlord_id = lu.id
      WHERE (i.landlord_id = $1 OR i.tenant_id = $1)
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
    const { rows: propRows } = await pool.query('SELECT id, title, landlord_id FROM properties WHERE id = $1', [propertyId]);
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

    const createdInspection = rows[0];

    // Send notification to the other party
    try {
      const propTitle = propRows[0]?.title || 'Property';
      if (role === 'tenant') {
        // Notify landlord
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            landlordId,
            'Property Inspection Request',
            `A tenant requested a viewing/inspection for "${propTitle}" on ${date} at ${time || '10:00 AM'}.`,
            'inspection',
            'inspection',
            createdInspection.id
          ]
        );
      } else {
        // Notify tenant
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            tenantId,
            'Inspection Scheduled',
            `An on-site inspection for "${propTitle}" has been scheduled for ${date} at ${time || '10:00 AM'}.`,
            'inspection',
            'inspection',
            createdInspection.id
          ]
        );
      }
    } catch (notifErr) {
      console.warn('Failed to dispatch inspection notification:', notifErr.message);
    }

    res.status(201).json({ success: true, inspection: createdInspection });
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
    if (req.body.location) { updates.push(`location = $${counter++}`); values.push(req.body.location); }

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

    const updatedInspection = rows[0];

    // Notify the other party about the update
    try {
      const otherUserId = updatedInspection.tenant_id === userId ? updatedInspection.landlord_id : updatedInspection.tenant_id;
      const propRes = await pool.query('SELECT title FROM properties WHERE id = $1', [updatedInspection.property_id]);
      const propTitle = propRes.rows[0]?.title || 'Property';

      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          otherUserId,
          'Inspection Update',
          `Inspection details for "${propTitle}" have been updated (Status: ${updatedInspection.status || 'Updated'}).`,
          'inspection',
          'inspection',
          updatedInspection.id
        ]
      );
    } catch (notifErr) {
      console.warn('Failed to notify inspection update:', notifErr.message);
    }

    res.json({ success: true, inspection: updatedInspection });
  } catch (error) {
    console.error('Update inspection error:', error);
    res.status(500).json({ error: 'Server error updating inspection' });
  }
};
