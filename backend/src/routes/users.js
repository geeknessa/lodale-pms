import express from 'express';
import { userController } from '../controllers/userController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/me', requireAuth, userController.getMe);
router.put('/me', requireAuth, userController.updateMe);

export default router;
