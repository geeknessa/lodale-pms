import express from 'express';
import { generateLease, signLease, getMyLeases, getLeaseById, updateLeaseStatus } from '../controllers/leaseController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { generateLeaseSchema, idParamSchema } from '../utils/validationSchemas.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Generate a new lease (landlords only)
router.post('/generate', requireAuth, requireRole('landlord'), validate({ body: generateLeaseSchema }), generateLease);

// Sign a lease (tenant or landlord)
router.patch('/:id/sign', requireAuth, validate({ params: idParamSchema }), signLease);

// Get my leases (tenant or landlord)
router.get('/me', requireAuth, getMyLeases);

// Get specific lease details
router.get('/:id', requireAuth, validate({ params: idParamSchema }), getLeaseById);

// Update lease status (e.g. end lease)
router.patch('/:id', requireAuth, validate({ params: idParamSchema }), updateLeaseStatus);

export default router;
