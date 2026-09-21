import express from 'express';
import { getNotifications, markAsRead, createNotification } from '../controllers/notificationController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createNotificationSchema, idParamSchema } from '../utils/validationSchemas.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.patch('/:id/read', validate({ params: idParamSchema }), markAsRead);
router.post('/', validate({ body: createNotificationSchema }), createNotification);

export default router;
