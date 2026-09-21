import express from 'express';
import { userController } from '../controllers/userController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { 
  updateUserSchema, 
  deactivateAccountSchema, 
  payRestorationFeeSchema, 
  changePasswordSchema, 
  requestEmailChangeSchema, 
  verifyEmailChangeSchema 
} from '../utils/validationSchemas.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/me', requireAuth, userController.getMe);
router.put('/me', requireAuth, validate({ body: updateUserSchema }), userController.updateMe);
router.get('/tenants', requireAuth, userController.getLandlordTenants);
router.post('/me/deactivate', requireAuth, validate({ body: deactivateAccountSchema }), userController.deactivateMyAccount);
router.post('/me/pay-restoration-fee', requireAuth, validate({ body: payRestorationFeeSchema }), userController.payRestorationFee);
router.put('/me/change-password', requireAuth, validate({ body: changePasswordSchema }), userController.changePassword);
router.post('/me/request-email-change', requireAuth, validate({ body: requestEmailChangeSchema }), userController.requestEmailChange);
router.post('/me/verify-email-change', requireAuth, validate({ body: verifyEmailChangeSchema }), userController.verifyEmailChange);

export default router;
