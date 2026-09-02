import express from 'express';
import { userController } from '../controllers/userController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { updateUserSchema } from '../utils/validationSchemas.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/me', requireAuth, userController.getMe);
router.put('/me', requireAuth, validate(updateUserSchema), userController.updateMe);
router.get('/tenants', requireAuth, userController.getLandlordTenants);

export default router;
