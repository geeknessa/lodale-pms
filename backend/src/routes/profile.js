import express from 'express';
import { profileController } from '../controllers/profileController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ── Authenticated user's own role-specific profile ──
router.get('/', requireAuth, profileController.getMyProfile);
router.put('/', requireAuth, profileController.updateMyProfile);

// ── Admin-only: look up any user's role-specific profile ──
router.get('/landlord/:userId', requireAuth, requireRole('admin'), profileController.getLandlordProfileById);
router.get('/tenant/:userId', requireAuth, requireRole('admin'), profileController.getTenantProfileById);

export default router;
