import express from 'express';
import { userController } from '../controllers/userController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { updateUserSchema } from '../utils/validationSchemas.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/me', requireAuth, userController.getMe);
router.put('/me', requireAuth, validate(updateUserSchema), userController.updateMe);
router.get('/tenants', requireAuth, userController.getLandlordTenants);
router.post('/me/deactivate', requireAuth, userController.deactivateMyAccount);
router.post('/me/pay-restoration-fee', requireAuth, userController.payRestorationFee);
router.put('/me/change-password', requireAuth, userController.changePassword);
router.post('/me/request-email-change', requireAuth, userController.requestEmailChange);
router.post('/me/verify-email-change', requireAuth, userController.verifyEmailChange);

export default router;
