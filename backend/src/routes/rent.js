import express from 'express';
import { getMyInvoices, createInvoice, recordPayment } from '../controllers/rentController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createInvoiceSchema, recordPaymentSchema } from '../utils/validationSchemas.js';
import { z } from 'zod';

const router = express.Router();

const invoiceIdParamSchema = z.object({ invoiceId: z.string().min(1, "Invoice ID is required") });

router.get('/invoices', requireAuth, getMyInvoices);
router.post('/invoice', requireAuth, requireRole('landlord'), validate({ body: createInvoiceSchema }), createInvoice);
router.post('/pay/:invoiceId', requireAuth, validate({ params: invoiceIdParamSchema, body: recordPaymentSchema }), recordPayment);

export default router;
