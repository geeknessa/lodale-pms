import express from 'express';
import { 
  applyForProperty, 
  getMyApplications, 
  getLandlordApplications, 
  getApplicationById,
  updateApplicationStatus, 
  withdrawApplication, 
  deleteLandlordApplication,
  requestInspection,
  scheduleInspection,
  updateInspectionOutcome,
  completeMoveIn
} from '../controllers/applicationController.js';
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

// Get specific application detail (nested invoice, lease, inspection)
router.get('/:id', requireAuth, validate({ params: idParamSchema }), getApplicationById);

// Update application status (landlord transition engine)
router.patch('/:id/status', requireAuth, requireRole('landlord'), validate({ params: idParamSchema, body: updateApplicationStatusSchema }), updateApplicationStatus);

// Delete application (landlord only - for declined applications)
router.delete('/landlord/:id', requireAuth, requireRole('landlord'), validate({ params: idParamSchema }), deleteLandlordApplication);

// Withdraw application (tenant only - early statuses)
router.delete('/:id', requireAuth, requireRole('tenant'), validate({ params: idParamSchema }), withdrawApplication);

// Inspection workflow sub-routes (optional pipeline path)
router.post('/:id/inspections/request', requireAuth, requireRole('tenant'), validate({ params: idParamSchema }), requestInspection);
router.post('/:id/inspections/schedule', requireAuth, requireRole('landlord'), validate({ params: idParamSchema }), scheduleInspection);
router.patch('/:id/inspections/:inspId', requireAuth, requireRole('landlord'), updateInspectionOutcome);

// Move-in finalization (landlord only)
router.post('/:id/move-in', requireAuth, requireRole('landlord'), validate({ params: idParamSchema }), completeMoveIn);

export default router;
