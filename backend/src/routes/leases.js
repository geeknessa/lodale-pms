import express from 'express';
import { generateLease, signLease, getMyLeases, getLeaseById } from '../controllers/leaseController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { generateLeaseSchema } from '../utils/validationSchemas.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Generate a new lease (landlords only)
router.post('/generate', requireAuth, requireRole('landlord'), validate(generateLeaseSchema), generateLease);

// Sign a lease (tenant or landlord)
router.patch('/:id/sign', requireAuth, signLease);

// Get my leases (tenant or landlord)
router.get('/me', requireAuth, getMyLeases);

// Get specific lease details
router.get('/:id', requireAuth, getLeaseById);

export default router;
