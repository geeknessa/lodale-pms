import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { reviewPropertySchema } from '../utils/validationSchemas.js';

const router = express.Router();

// Apply auth and admin role requirement to all admin routes
router.use(requireAuth, requireRole('admin'));

router.get('/properties/pending', adminController.getPendingProperties);
router.post('/properties/:id/review', validate(reviewPropertySchema), adminController.reviewProperty);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);
router.post('/reset-database', adminController.resetDatabase);

export default router;
