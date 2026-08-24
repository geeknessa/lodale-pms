import { pool } from '../config/db.js';

// @desc    Get all conversations for the current user
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res) => {
  const userId = req.user.id;

  try {
    // We want a list of unique users this user has chatted with, plus the latest message.
    // Also, we can pre-populate if they applied for a property even if no messages yet?
    // The user requested full messaging system. We will just fetch active chats for now.
    
    // We will do a complex query to get latest message per chat partner
    const conversations = await pool.query(
      `WITH RankedMessages AS (
         SELECT 
           CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS partner_id,
           message,
           created_at,
           is_read,
           sender_id,
           ROW_NUMBER() OVER(
             PARTITION BY CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END 
             ORDER BY created_at DESC
           ) as rn
         FROM chat_messages
         WHERE sender_id = $1 OR receiver_id = $1
       )
       SELECT 
         rm.partner_id,
         rm.message AS last_message,
         rm.created_at AS last_message_time,
         rm.is_read,
         rm.sender_id,
         u.first_name,
         u.last_name,
         u.avatar_url,
         u.primary_role
       FROM RankedMessages rm
       JOIN users u ON rm.partner_id = u.id
       WHERE rm.rn = 1
       ORDER BY rm.created_at DESC`,
      [userId]
    );

    res.json({ success: true, conversations: conversations.rows });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching conversations' });
  }
};

// @desc    Get messages with a specific user
// @route   GET /api/chat/:partnerId
// @access  Private
export const getMessages = async (req, res) => {
  const userId = req.user.id;
  const { partnerId } = req.params;

  try {
    const messages = await pool.query(
      `SELECT id, sender_id, receiver_id, property_id, message, is_read, created_at
       FROM chat_messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [userId, partnerId]
    );

    // Mark as read if we are the receiver
    await pool.query(
      `UPDATE chat_messages SET is_read = TRUE 
       WHERE receiver_id = $1 AND sender_id = $2 AND is_read = FALSE`,
      [userId, partnerId]
    );

    res.json({ success: true, messages: messages.rows });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching messages' });
  }
};

// @desc    Send a message
// @route   POST /api/chat
// @access  Private
export const sendMessage = async (req, res) => {
  const senderId = req.user.id;
  const { receiverId, propertyId, message } = req.body;

  if (!receiverId || !message) {
    return res.status(400).json({ success: false, message: 'Receiver ID and message are required' });
  }

  try {
    const newMessage = await pool.query(
      `INSERT INTO chat_messages (sender_id, receiver_id, property_id, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [senderId, receiverId, propertyId || null, message]
    );

    res.status(201).json({ success: true, message: newMessage.rows[0] });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Server error sending message' });
  }
};
