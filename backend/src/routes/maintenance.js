import express from 'express';
import { createRequest, getMyRequests, updateRequestStatus } from '../controllers/maintenanceController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', requireAuth, requireRole('tenant'), createRequest);
router.get('/', requireAuth, getMyRequests);
router.patch('/:id', requireAuth, requireRole('landlord'), updateRequestStatus);

export default router;
