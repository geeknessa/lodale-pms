import express from 'express';
import { 
  getMyInvoices, 
  getInvoiceByApplication, 
  getInvoicesByLease,
  createInvoice, 
  recordPayment,
  initializePaystackPayment,
  verifyPaystackPayment,
  handlePaystackWebhook,
  getBanksList,
  getLandlordReceipts,
  signReceipt,
  sendReceipt
} from '../controllers/rentController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createInvoiceSchema, recordPaymentSchema } from '../utils/validationSchemas.js';
import { z } from 'zod';

const router = express.Router();

const invoiceIdParamSchema = z.object({ invoiceId: z.string().min(1, "Invoice ID is required") });

router.get('/banks', requireAuth, getBanksList);
router.get('/invoices', requireAuth, getMyInvoices);
router.get('/invoice/application/:applicationId', requireAuth, getInvoiceByApplication);
router.get('/invoices/lease/:leaseId', requireAuth, getInvoicesByLease);
router.post('/invoice', requireAuth, requireRole('landlord'), validate({ body: createInvoiceSchema }), createInvoice);
router.post('/pay/:invoiceId', requireAuth, validate({ params: invoiceIdParamSchema, body: recordPaymentSchema }), recordPayment);

// Paystack payment endpoints
router.post('/paystack/initialize/:invoiceId', requireAuth, validate({ params: invoiceIdParamSchema }), initializePaystackPayment);
router.post('/paystack/verify', requireAuth, verifyPaystackPayment);
router.post('/paystack/webhook', express.raw({ type: '*/*' }), handlePaystackWebhook);

// Landlord receipts endpoints
router.get('/receipts', requireAuth, requireRole('landlord'), getLandlordReceipts);
router.post('/receipts/:paymentId/sign', requireAuth, requireRole('landlord'), signReceipt);
router.post('/receipts/:paymentId/send', requireAuth, requireRole('landlord'), sendReceipt);

export default router;
