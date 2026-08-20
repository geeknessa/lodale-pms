import express from 'express';
import { applyForProperty, getMyApplications } from '../controllers/applicationController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply for a property (tenant only)
router.post('/', requireAuth, requireRole('tenant'), applyForProperty);

// Get my applications (tenant only)
router.get('/me', requireAuth, requireRole('tenant'), getMyApplications);

export default router;
