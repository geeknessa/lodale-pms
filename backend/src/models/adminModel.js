import { pool } from '../config/db.js';

export const AdminModel = {
  async getPendingProperties() {
    const res = await pool.query(`
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
    return res.rows;
  },

  async updatePropertyStatus(idOrSlug, newStatus) {
    const res = await pool.query(`
      UPDATE properties
      SET status = $1, updated_at = NOW()
      WHERE id::text = $2 OR slug = $2
      RETURNING *
    `, [newStatus, idOrSlug]);
    return res.rows[0] || null;
  },

  async updateQueueStatus(propertyId, newQueueStatus, rejectionReason) {
    await pool.query(`
      UPDATE listing_approval_queue
      SET queue_status = $1, rejection_reason = $2, reviewed_at = NOW()
      WHERE property_id = $3
    `, [newQueueStatus, rejectionReason, propertyId]);
  },

  async getAllUsers() {
    const res = await pool.query(`
      SELECT id, first_name, last_name, email, phone_number, primary_role, id_verification_status, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    return res.rows;
  }
};
