import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { propertyController } from '../controllers/propertyController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { reviewPropertySchema, idParamSchema, updateUserStatusSchema } from '../utils/validationSchemas.js';
import { z } from 'zod';

const restoreRecycleBinItemSchema = z.object({
  itemType: z.enum(['user', 'property']),
  itemId: z.string().min(1),
  restorationFee: z.union([z.number(), z.string().transform(Number)]).optional(),
  isFeePaidManually: z.boolean().optional()
});

const router = express.Router();

// Apply auth and admin role requirement to all admin routes
router.use(requireAuth, requireRole('admin'));

router.get('/properties/pending', adminController.getPendingProperties);
router.get('/properties', adminController.getPendingProperties);
router.get('/properties/requests', propertyController.getPendingRequests);
router.post('/properties/:id/review', validate({ params: idParamSchema, body: reviewPropertySchema }), adminController.reviewProperty);
router.post('/properties/:id/approve-deletion', validate({ params: idParamSchema }), propertyController.approvePropertyDeletion);
router.post('/properties/:id/reject-deletion', validate({ params: idParamSchema }), propertyController.rejectPropertyDeletion);
router.post('/properties/:id/approve-suspension', validate({ params: idParamSchema }), propertyController.approvePropertySuspension);
router.post('/properties/:id/reject-suspension', validate({ params: idParamSchema }), propertyController.rejectPropertySuspension);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', validate({ params: idParamSchema, body: updateUserStatusSchema }), adminController.updateUserStatus);
router.delete('/users/:id', validate({ params: idParamSchema }), adminController.deleteUser);
router.get('/recycle-bin', adminController.getRecycleBin);
router.post('/recycle-bin/restore', validate({ body: restoreRecycleBinItemSchema }), adminController.restoreRecycleBinItem);

export default router;
