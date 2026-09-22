import express from 'express';
import { getConversations, getMessages, sendMessage, deleteConversation } from '../controllers/chatController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { sendMessageSchema } from '../utils/validationSchemas.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { z } from 'zod';

const router = express.Router();

const partnerIdParamSchema = z.object({ partnerId: z.string().min(1) });

// All chat routes require authentication
router.use(requireAuth);

// Get list of conversations
router.get('/conversations', getConversations);

// Send a new message
router.post('/', validate({ body: sendMessageSchema }), sendMessage);

// Get messages for a specific chat partner
router.get('/:partnerId', validate({ params: partnerIdParamSchema }), getMessages);

// Delete a conversation with a specific partner
router.delete('/:partnerId', validate({ params: partnerIdParamSchema }), deleteConversation);

export default router;
