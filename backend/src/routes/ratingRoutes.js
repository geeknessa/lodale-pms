import { Router } from 'express';
import { ratingController } from '../controllers/ratingController.js';
import { requireAuth, optionalAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Public / Authenticated read endpoint
router.get('/user/:userId', optionalAuth, ratingController.getUserRatings);

// Authenticated write endpoint
router.post('/', requireAuth, ratingController.submitRating);

export default router;
