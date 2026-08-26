import express from 'express';
import { getMyInvoices, createInvoice, recordPayment } from '../controllers/rentController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/invoices', requireAuth, getMyInvoices);
router.post('/invoice', requireAuth, requireRole('landlord'), createInvoice);
router.post('/pay/:invoiceId', requireAuth, recordPayment);

export default router;
