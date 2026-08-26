import express from 'express';
import { getConversations, getMessages, sendMessage } from '../controllers/chatController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { sendMessageSchema } from '../utils/validationSchemas.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All chat routes require authentication
router.use(requireAuth);

// Get list of conversations
router.get('/conversations', getConversations);

// Send a new message
router.post('/', validate(sendMessageSchema), sendMessage);

// Get messages for a specific chat partner
router.get('/:partnerId', getMessages);

export default router;
