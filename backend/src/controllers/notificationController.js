import { pool } from '../db/db.js';

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    const notifs = await pool.query(
      `SELECT id, title, message, type, is_read, created_at 
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ success: true, notifications: notifs.rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

// @desc    Mark notification(s) as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params; // if id === 'all', mark all as read

  try {
    if (id === 'all') {
      await pool.query(
        `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      );
    } else {
      await pool.query(
        `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );
    }
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Server error marking notification as read' });
  }
};

// @desc    Create a new notification (internal/admin or for specific system triggers)
// @route   POST /api/notifications
// @access  Private
export const createNotification = async (req, res) => {
  const { userId, title, message, type } = req.body;

  if (!userId || !title || !message || !type) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const newNotif = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, title, message, type]
    );
    res.status(201).json({ success: true, notification: newNotif.rows[0] });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ success: false, message: 'Server error creating notification' });
  }
};
