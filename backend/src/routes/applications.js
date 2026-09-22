import express from 'express';
import { applyForProperty, getMyApplications, getLandlordApplications, updateApplicationStatus, withdrawApplication, deleteLandlordApplication } from '../controllers/applicationController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { applyPropertySchema, idParamSchema, updateApplicationStatusSchema } from '../utils/validationSchemas.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply for a property (tenant only)
router.post('/', requireAuth, requireRole('tenant'), validate({ body: applyPropertySchema }), applyForProperty);

// Get my applications (tenant only)
router.get('/me', requireAuth, requireRole('tenant'), getMyApplications);

// Get landlord's applications
router.get('/landlord', requireAuth, requireRole('landlord'), getLandlordApplications);

// Update application status
router.patch('/:id/status', requireAuth, requireRole('landlord'), validate({ params: idParamSchema, body: updateApplicationStatusSchema }), updateApplicationStatus);

// Delete application (landlord only - for declined/withdrawn applications)
router.delete('/landlord/:id', requireAuth, requireRole('landlord'), validate({ params: idParamSchema }), deleteLandlordApplication);

// Withdraw application (tenant only)
router.delete('/:id', requireAuth, requireRole('tenant'), validate({ params: idParamSchema }), withdrawApplication);

export default router;
