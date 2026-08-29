import { pool } from '../db/db.js';
import { UserModel } from './userModel.js';

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

  async getAllProperties() {
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
      LEFT JOIN (
        SELECT DISTINCT ON (property_id) property_id, queue_status, rejection_reason, submitted_at
        FROM listing_approval_queue
        ORDER BY property_id, submitted_at DESC
      ) q ON p.id = q.property_id
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
    const res = await pool.query(`
      UPDATE listing_approval_queue
      SET queue_status = $1, rejection_reason = $2, reviewed_at = NOW()
      WHERE property_id = $3
      RETURNING *
    `, [newQueueStatus, rejectionReason, propertyId]);

    if (res.rowCount === 0) {
      await pool.query(`
        INSERT INTO listing_approval_queue (property_id, queue_status, rejection_reason, reviewed_at)
        VALUES ($1, $2, $3, NOW())
      `, [propertyId, newQueueStatus, rejectionReason]);
    }
  },

  async getAllUsers() {
    const res = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number, u.primary_role, u.id_verification_status, u.account_status, u.created_at,
             COUNT(p.id)::int AS listings_count
      FROM users u
      LEFT JOIN properties p ON u.id = p.landlord_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    return res.rows;
  },

  async deleteUser(id) {
    return await UserModel.deleteUser(id);
  }
};
