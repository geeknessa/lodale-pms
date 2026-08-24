import express from 'express';
import { applyForProperty, getMyApplications, getLandlordApplications, updateApplicationStatus } from '../controllers/applicationController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply for a property (tenant only)
router.post('/', requireAuth, requireRole('tenant'), applyForProperty);

// Get my applications (tenant only)
router.get('/me', requireAuth, requireRole('tenant'), getMyApplications);

// Get landlord's applications
router.get('/landlord', requireAuth, requireRole('landlord'), getLandlordApplications);

// Update application status
router.patch('/:id/status', requireAuth, requireRole('landlord'), updateApplicationStatus);

export default router;
