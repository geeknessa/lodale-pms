import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

/**
 * GET /api/admin/properties/pending
 * Fetch all properties awaiting admin review (status: pending_review or draft)
 */
router.get('/properties/pending', async (req, res) => {
  try {
    const propRes = await pool.query(`
      SELECT p.*,
             u.first_name AS landlord_first_name,
             u.last_name AS landlord_last_name,
             u.email AS landlord_email,
             u.phone_number AS landlord_phone,
             q.queue_status,
             q.rejection_reason AS admin_notes,
             q.submitted_at
      FROM properties p
      LEFT JOIN users u ON p.landlord_id = u.id
      LEFT JOIN listing_approval_queue q ON p.id = q.property_id
      WHERE p.status::text IN ('pending_review', 'draft')
      ORDER BY p.created_at DESC
    `);

    const properties = propRes.rows;

    const formatted = await Promise.all(properties.map(async p => {
      const amenitiesRes = await pool.query('SELECT amenity FROM property_amenities WHERE property_id = $1', [p.id]);

      return {
        id: p.id,
        title: p.title,
        location: `${p.address_line1}, ${p.city}`,
        price: `₦${Number(p.rent_amount).toLocaleString()}/yr`,
        type: p.property_type,
        status: p.status === 'pending_review' ? (p.queue_status === 'under_review' ? 'Info Requested' : 'Pending Approval') : 'Draft',
        rawStatus: p.status,
        submittedAt: p.created_at,
        landlord: {
          id: p.landlord_id,
          name: `${p.landlord_first_name || 'Landlord'} ${p.landlord_last_name || ''}`.trim(),
          email: p.landlord_email,
          phone: p.landlord_phone,
        },
        description: p.description,
        amenities: amenitiesRes.rows.map(a => a.amenity),
        adminNotes: p.admin_notes,
        ownershipDoc: p.ownership_doc,
        ownershipDocUrl: p.ownership_doc_url,
      };
    }));

    res.json(formatted);
  } catch (error) {
    console.error('[Admin Route Error]:', error);
    res.status(500).json({ error: 'Failed to fetch pending property listings.' });
  }
});

/**
 * POST /api/admin/properties/:id/review
 * Action: 'approve' | 'reject' | 'request_info'
 */
router.post('/properties/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, notes } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Review action is required.' });
    }

    let newPropertyStatus = 'pending_review';
    let newQueueStatus = 'queued';
    let rejectionReason = reason || notes || null;

    if (action === 'approve') {
      newPropertyStatus = 'active_vacant';
      newQueueStatus = 'approved';
    } else if (action === 'reject') {
      newPropertyStatus = 'inactive';
      newQueueStatus = 'rejected';
    } else if (action === 'request_info') {
      newPropertyStatus = 'pending_review';
      newQueueStatus = 'under_review';
    }

    // 1. Update property status
    const updateProp = await pool.query(`
      UPDATE properties
      SET status = $1::property_status, updated_at = NOW()
      WHERE id::text = $2 OR slug = $2
      RETURNING *
    `, [newPropertyStatus, id]);

    if (updateProp.rows.length === 0) {
      return res.status(404).json({ error: 'Property listing not found.' });
    }

    const property = updateProp.rows[0];

    // 2. Update listing_approval_queue
    await pool.query(`
      UPDATE listing_approval_queue
      SET queue_status = $1::listing_queue_status, rejection_reason = $2, reviewed_at = NOW()
      WHERE property_id = $3
    `, [newQueueStatus, rejectionReason, property.id]);

    res.json({
      property,
      action,
      status: newPropertyStatus,
      queue_status: newQueueStatus,
      message: action === 'approve'
        ? `Property "${property.title}" approved and is now active & live!`
        : (action === 'reject'
          ? `Property "${property.title}" rejected.`
          : `Information requested for "${property.title}".`)
    });
  } catch (error) {
    console.error('[Admin Review Route Error]:', error);
    res.status(500).json({ error: 'Failed to process listing review.' });
  }
});

/**
 * GET /api/admin/users
 * Fetch all registered users from database
 */
router.get('/users', async (req, res) => {
  try {
    const userRes = await pool.query(`
      SELECT id, first_name, last_name, email, phone_number, primary_role, id_verification_status, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    const formatted = userRes.rows.map(u => ({
      id: u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
      email: u.email,
      phone: u.phone_number || '',
      role: (u.primary_role || 'Tenant').toLowerCase().includes('landlord') ? 'Landlord' : ((u.primary_role || '').toLowerCase().includes('admin') ? 'Admin' : 'Tenant'),
      status: 'Active',
      joinedDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      listingsCount: (u.primary_role || '').toLowerCase().includes('landlord') ? 1 : 0,
      verifications: [
        u.id_verification_status === 'verified' ? 'ID Verified' : 'ID Pending',
        'Email Verified'
      ]
    }));

    res.json(formatted);
  } catch (error) {
    console.error('[Admin Users Route Error]:', error);
    res.status(500).json({ error: 'Failed to fetch registered users.' });
  }
});

export default router;
