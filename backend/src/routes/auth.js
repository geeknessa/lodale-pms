import express from 'express';
import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { registerSchema, loginSchema } from '../utils/validationSchemas.js';

import rateLimit from 'express-rate-limit';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.' }
});

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.get('/me', requireAuth, authController.getMe);

export default router;
