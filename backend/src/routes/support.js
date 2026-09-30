import express from 'express';
import { pool } from '../db/db.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { z } from 'zod';

const router = express.Router();

const supportMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty")
});

const adminReplySchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  message: z.string().min(1, "Message cannot be empty")
});

/**
 * @route GET /api/support
 * @desc Get all support messages for the authenticated user
 * @access Private (Tenant/Landlord)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT id, user_id, sender_role, message, is_read, created_at
      FROM support_messages
      WHERE user_id = $1
      ORDER BY created_at ASC;
    `;
    const { rows } = await pool.query(query, [userId]);
    res.json(rows);
  } catch (error) {
    console.error('[Support API Error]:', error);
    res.status(500).json({ error: 'Server error retrieving messages' });
  }
});

/**
 * @route POST /api/support
 * @desc Send a new support message to the Admin
 * @access Private (Tenant/Landlord)
 */
router.post('/', requireAuth, validate({ body: supportMessageSchema }), async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.primary_role || req.user.role || 'tenant';
    const { message } = req.body;

    const query = `
      INSERT INTO support_messages (user_id, sender_role, message)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [userId, role, message]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('[Support API Error]:', error);
    res.status(500).json({ error: 'Server error sending message' });
  }
});

/**
 * @route GET /api/support/admin/threads
 * @desc Admin only: Get all distinct support threads (grouped by user)
 * @access Private (Admin)
 */
router.get('/admin/threads', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id as user_id, 
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        u.primary_role as user_role,
        u.avatar_url,
        (SELECT message FROM support_messages sm WHERE sm.user_id = u.id ORDER BY sm.created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM support_messages sm WHERE sm.user_id = u.id ORDER BY sm.created_at DESC LIMIT 1) as last_message_time,
        json_agg(
          json_build_object(
            'id', sm2.id,
            'sender_role', sm2.sender_role,
            'message', sm2.message,
            'is_read', sm2.is_read,
            'created_at', sm2.created_at
          ) ORDER BY sm2.created_at ASC
        ) as messages
      FROM users u
      JOIN support_messages sm2 ON sm2.user_id = u.id
      GROUP BY u.id
      ORDER BY last_message_time DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('[Support Admin API Error]:', error);
    res.status(500).json({ error: 'Server error retrieving admin threads' });
  }
});

/**
 * @route POST /api/support/admin/reply
 * @desc Admin only: Reply to a specific user's support thread
 * @access Private (Admin)
 */
router.post('/admin/reply', requireAuth, requireRole('admin'), validate({ body: adminReplySchema }), async (req, res) => {
  try {
    const { userId, message } = req.body;

    const query = `
      INSERT INTO support_messages (user_id, sender_role, message, is_read)
      VALUES ($1, 'admin', $2, TRUE)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [userId, message]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('[Support Admin API Error]:', error);
    res.status(500).json({ error: 'Server error sending admin reply' });
  }
});

export default router;
