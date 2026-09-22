import express from 'express';
import { createRequest, getMyRequests, updateRequestStatus } from '../controllers/maintenanceController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createMaintenanceSchema, updateMaintenanceStatusSchema, idParamSchema } from '../utils/validationSchemas.js';

const router = express.Router();

router.post('/', requireAuth, requireRole('tenant'), validate({ body: createMaintenanceSchema }), createRequest);
router.get('/', requireAuth, getMyRequests);
router.patch('/:id', requireAuth, requireRole('landlord'), validate({ params: idParamSchema, body: updateMaintenanceStatusSchema }), updateRequestStatus);

export default router;
