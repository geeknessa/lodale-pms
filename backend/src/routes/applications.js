import express from 'express';
import { applyForProperty, getMyApplications, getLandlordApplications, updateApplicationStatus, withdrawApplication } from '../controllers/applicationController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { applyPropertySchema } from '../utils/validationSchemas.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply for a property (tenant only)
router.post('/', requireAuth, requireRole('tenant'), validate(applyPropertySchema), applyForProperty);

// Get my applications (tenant only)
router.get('/me', requireAuth, requireRole('tenant'), getMyApplications);

// Get landlord's applications
router.get('/landlord', requireAuth, requireRole('landlord'), getLandlordApplications);

// Update application status
router.patch('/:id/status', requireAuth, requireRole('landlord'), updateApplicationStatus);

// Withdraw application (tenant only)
router.delete('/:id', requireAuth, requireRole('tenant'), withdrawApplication);

export default router;
