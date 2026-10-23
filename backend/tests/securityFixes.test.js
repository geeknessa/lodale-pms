import dotenv from 'dotenv';
dotenv.config();

// Ensure test environment variables are set
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_at_least_32_characters_long';
process.env.PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_paystack_secret_key_12345';

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { pool } from '../src/db/db.js';
import { requireAuth } from '../src/middlewares/authMiddleware.js';
import { 
  recordPayment, 
  verifyPaystackPayment, 
  handlePaystackWebhook,
  initializePaystackPayment,
  markInvoicePaidWithPaystackHelper,
  createInvoice,
  getLandlordReceipts
} from '../src/controllers/rentController.js';
import { paystackService } from '../src/services/paystackService.js';

// Helper to mock Express req, res, next
function createMockReqRes(overrides = {}) {
  const req = {
    headers: {},
    params: {},
    query: {},
    body: {},
    user: null,
    originalUrl: '/api/test',
    ...overrides,
  };

  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      return this;
    },
  };

  const next = jest.fn();

  return { req, res, next };
}

describe('LODALE PMS - Security Bug Fixes Suite', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  // =========================================================================
  // BUG 2: requireAuth DB lookup fails closed with 503
  // =========================================================================
  describe('BUG 2: requireAuth Fail-Closed Error Handling', () => {
    test('requireAuth returns 503 when the status lookup throws', async () => {
      const token = jwt.sign(
        { id: 'user-db-err-1', email: 'user@example.com', role: 'tenant' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const { req, res, next } = createMockReqRes({
        headers: { authorization: `Bearer ${token}` }
      });

      // Mock pool.query to simulate DB failure during account_status lookup
      jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('PostgreSQL connection dropped'));

      await requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(503);
      expect(res.body).toEqual({ error: 'Service temporarily unavailable' });
    });

    test('uses DB role as source of truth when DB role differs from token role', async () => {
      const token = jwt.sign(
        { id: 'user-role-change-1', email: 'user@example.com', role: 'admin', primary_role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const { req, res, next } = createMockReqRes({
        headers: { authorization: `Bearer ${token}` }
      });

      // DB returns tenant instead of admin
      jest.spyOn(pool, 'query').mockResolvedValueOnce({
        rows: [{
          id: 'user-role-change-1',
          email: 'user@example.com',
          primary_role: 'tenant',
          account_status: 'active',
          restoration_fee_amount: null
        }]
      });

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.id).toBe('user-role-change-1');
      expect(req.user.email).toBe('user@example.com');
      expect(req.user.role).toBe('tenant');
      expect(req.user.primary_role).toBe('tenant');
    });

    test('uses DB role when token role is tenant but DB was promoted to landlord', async () => {
      const token = jwt.sign(
        { id: 'user-role-change-2', email: 'promoted@example.com', role: 'tenant', primary_role: 'tenant' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const { req, res, next } = createMockReqRes({
        headers: { authorization: `Bearer ${token}` }
      });

      jest.spyOn(pool, 'query').mockResolvedValueOnce({
        rows: [{
          id: 'user-role-change-2',
          email: 'promoted@example.com',
          primary_role: 'landlord',
          account_status: 'active',
          restoration_fee_amount: null
        }]
      });

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.role).toBe('landlord');
      expect(req.user.primary_role).toBe('landlord');
    });
  });

  // =========================================================================
  // BUG 1: recordPayment Verification & Authorization
  // =========================================================================
  describe('BUG 1: recordPayment Verification Security', () => {
    test('tenant sending paymentMethod "Verified by Landlord" gets 403 and the invoice is NOT marked paid', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const fakeInvoice = {
        id: 'inv-101',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-789',
        status: 'pending',
        grand_total: 150000,
        amount: 150000,
      };

      // Mock client queries:
      // 1. BEGIN
      // 2. Fetch invoice (by id)
      // 3. ROLLBACK (because tenant attempted verification)
      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' }) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1, rows: [fakeInvoice] }) // Invoice lookup by id
        .mockResolvedValueOnce({ command: 'ROLLBACK' }); // ROLLBACK on 403

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-101' },
        user: { id: 'tenant-123', role: 'tenant' },
        body: {
          paymentMethod: 'Verified by Landlord',
          amount: 150000,
        },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toMatch(/Tenants cannot verify payments/i);

      // Verify invoice was NOT updated to 'paid'
      const updateCalls = mockClient.query.mock.calls.filter(call => 
        typeof call[0] === 'string' && call[0].includes("UPDATE rent_invoices SET status = 'paid'")
      );
      expect(updateCalls.length).toBe(0);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('landlord who does not own the property gets 403', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const fakeInvoice = {
        id: 'inv-102',
        tenant_id: 'tenant-123',
        landlord_id: 'legit-landlord-1',
        property_id: 'prop-102',
        status: 'payment_submitted',
        grand_total: 200000,
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [fakeInvoice] }) // Invoice lookup by id
        .mockResolvedValueOnce({ command: 'ROLLBACK' });

      // Attacker is landlord-rogue, but invoice belongs to legit-landlord-1
      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-102' },
        user: { id: 'landlord-rogue', role: 'landlord' },
        body: {
          paymentMethod: 'Verified by Landlord',
        },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toMatch(/does not belong to your property|not a party/i);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('landlord where property ownership in properties table does not match gets 403', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const fakeInvoice = {
        id: 'inv-103',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-sneaky',
        property_id: 'prop-103',
        status: 'payment_submitted',
        grand_total: 200000,
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [fakeInvoice] }) // Invoice lookup by id
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ landlord_id: 'true-property-owner' }] }) // Properties table lookup
        .mockResolvedValueOnce({ command: 'ROLLBACK' });

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-103' },
        user: { id: 'landlord-sneaky', role: 'landlord' },
        body: {
          paymentMethod: 'Bank Transfer',
        },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toMatch(/You do not own the property attached to this invoice/i);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('verifies and marks invoice paid with expected amount when amount is missing from landlord request', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const fakeInvoice = {
        id: 'inv-val-1',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        property_title: 'Sunset Villa',
        status: 'unpaid',
        subtotal: 200000,
        grand_total: 200000,
        amount: 200000,
      };

      const paymentRecord = {
        id: 'pay-missing-amt-1',
        invoice_id: 'inv-val-1',
        amount: 200000,
        payment_method: 'Verified by Landlord',
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [fakeInvoice] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ landlord_id: 'landlord-456' }] }) // propCheck
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 0 }] }) // existing paid sum
        .mockResolvedValueOnce({ rowCount: 1, rows: [paymentRecord] }) // INSERT into rent_payments
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ ...fakeInvoice, status: 'paid' }] }) // UPDATE rent_invoices
        .mockResolvedValueOnce({ command: 'COMMIT' });

      jest.spyOn(pool, 'query').mockResolvedValueOnce({ rowCount: 1, rows: [] }); // Notification insert

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-val-1' },
        user: { id: 'landlord-456', role: 'landlord' },
        body: {
          paymentMethod: 'Verified by Landlord',
          notes: 'Verified by Landlord'
        }, // missing amount
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/confirmed successfully/i);
      expect(res.body.invoice.status).toBe('paid');
      expect(res.body.payment.amount).toBe(200000);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('rejects landlord verification with 400 when amount is provided and is <= 0', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const fakeInvoice = {
        id: 'inv-val-zero',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        status: 'unpaid',
        subtotal: 200000,
        amount: 200000,
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [fakeInvoice] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ landlord_id: 'landlord-456' }] }) // propCheck
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 0 }] }) // existing paid sum
        .mockResolvedValueOnce({ command: 'ROLLBACK' });

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-val-zero' },
        user: { id: 'landlord-456', role: 'landlord' },
        body: { amount: 0 },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/positive number/i);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('rejects landlord verification with 400 when amount is less than expected amount without partial: true', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const fakeInvoice = {
        id: 'inv-val-2',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        status: 'unpaid',
        grand_total: 200000,
        subtotal: 150000,
        amount: 200000,
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [fakeInvoice] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ landlord_id: 'landlord-456' }] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 0 }] }) // existing paid sum
        .mockResolvedValueOnce({ command: 'ROLLBACK' });

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-val-2' },
        user: { id: 'landlord-456', role: 'landlord' },
        body: {
          amount: 100000, // less than 200,000
        },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/less than the expected invoice amount/i);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('records payment but does NOT mark invoice paid when amount is less than expected amount and partial: true', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const fakeInvoice = {
        id: 'inv-val-3',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        property_title: 'Sunset Villa',
        status: 'unpaid',
        grand_total: 200000,
        amount: 200000,
      };

      const paymentRecord = {
        id: 'pay-part-1',
        invoice_id: 'inv-val-3',
        amount: 50000,
        payment_method: 'Bank Transfer',
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [fakeInvoice] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ landlord_id: 'landlord-456' }] }) // propCheck
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 0 }] }) // existing paid sum
        .mockResolvedValueOnce({ rowCount: 1, rows: [paymentRecord] }) // INSERT into rent_payments
        .mockResolvedValueOnce({ rowCount: 1, rows: [] }) // UPDATE rent_invoices SET updated_at = NOW()
        .mockResolvedValueOnce({ command: 'COMMIT' });

      jest.spyOn(pool, 'query').mockResolvedValueOnce({ rowCount: 1, rows: [] }); // Notification insert

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-val-3' },
        user: { id: 'landlord-456', role: 'landlord' },
        body: {
          amount: 50000,
          partial: true,
        },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/Partial payment recorded/i);
      expect(res.body.payment).toBeDefined();
      expect(res.body.invoice.status).not.toBe('paid');

      // Verify invoice was NOT updated to 'paid'
      const updateCalls = mockClient.query.mock.calls.filter(call => 
        typeof call[0] === 'string' && call[0].includes("UPDATE rent_invoices SET status = 'paid'")
      );
      expect(updateCalls.length).toBe(0);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('records payment and marks invoice paid when amount is full', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const fakeInvoice = {
        id: 'inv-val-4',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        property_title: 'Sunset Villa',
        status: 'unpaid',
        grand_total: 200000,
        amount: 200000,
      };

      const paymentRecord = {
        id: 'pay-full-1',
        invoice_id: 'inv-val-4',
        amount: 200000,
        payment_method: 'Bank Transfer',
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [fakeInvoice] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ landlord_id: 'landlord-456' }] }) // propCheck
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 0 }] }) // existing paid sum
        .mockResolvedValueOnce({ rowCount: 1, rows: [paymentRecord] }) // INSERT into rent_payments
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ ...fakeInvoice, status: 'paid' }] }) // UPDATE rent_invoices
        .mockResolvedValueOnce({ command: 'COMMIT' });

      jest.spyOn(pool, 'query').mockResolvedValueOnce({ rowCount: 1, rows: [] }); // Notification insert

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-val-4' },
        user: { id: 'landlord-456', role: 'landlord' },
        body: {
          amount: 200000,
        },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/confirmed successfully/i);
      expect(res.body.invoice.status).toBe('paid');

      const updateCalls = mockClient.query.mock.calls.filter(call => 
        typeof call[0] === 'string' && call[0].includes("UPDATE rent_invoices SET status = 'paid'")
      );
      expect(updateCalls.length).toBe(1);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // BUG 10: Unambiguous invoice lookup (by ID first, fallback to application_id, 409 on duplicate)
  // =========================================================================
  describe('BUG 10: Unambiguous Invoice Lookup', () => {
    test('recordPayment returns 409 when fallback application_id matches multiple invoices', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // Lookup by invoice id returns 0
        .mockResolvedValueOnce({ rowCount: 2, rows: [{ id: 'inv-1' }, { id: 'inv-2' }] }) // Fallback by application_id matches 2 rows
        .mockResolvedValueOnce({ command: 'ROLLBACK' });

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'app-duplicate-123' },
        user: { id: 'tenant-123', role: 'tenant' },
        body: { reference: 'REF123' },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toMatch(/Multiple invoices found/i);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('initializePaystackPayment returns 409 when fallback application_id matches multiple invoices', async () => {
      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // Lookup by invoice id returns 0
        .mockResolvedValueOnce({ rowCount: 3, rows: [{ id: 'inv-1' }, { id: 'inv-2' }, { id: 'inv-3' }] }); // Fallback returns 3

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'app-duplicate-456' },
        user: { id: 'tenant-123', email: 'tenant@example.com', role: 'tenant' },
      });

      await initializePaystackPayment(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toMatch(/Multiple invoices found/i);
    });
  });

  // =========================================================================
  // BUG 3: verifyPaystackPayment and Webhook
  // =========================================================================
  describe('BUG 3: Paystack Payment Verification & Webhook Security', () => {
    test('verify rejects a caller who is not the invoice tenant', async () => {
      jest.spyOn(paystackService, 'verifyTransaction').mockResolvedValueOnce({
        status: 'success',
        currency: 'NGN',
        amount: 5000000, // 50,000 NGN in kobo
        metadata: { invoice_id: 'inv-target-1' },
      });

      const fakeInvoice = {
        id: 'inv-target-1',
        tenant_id: 'real-tenant-id',
        subtotal: 50000,
        grand_total: 50000,
        amount: 50000,
      };

      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [fakeInvoice], // invoice lookup (checked before auth)
        });

      // Caller is an attacker with a different tenant ID
      const { req, res } = createMockReqRes({
        user: { id: 'attacker-tenant-id', role: 'tenant' },
        body: { reference: 'PAY_REF_123' },
      });

      await verifyPaystackPayment(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toMatch(/Unauthorized: This is not your invoice/i);
    });

    test('verify rejects an underpaid amount', async () => {
      // Expected amount is ₦100,000 (10,000,000 kobo), but Paystack only received ₦50,000 (5,000,000 kobo)
      jest.spyOn(paystackService, 'verifyTransaction').mockResolvedValueOnce({
        status: 'success',
        currency: 'NGN',
        amount: 5000000, // 5,000,000 kobo (50,000 NGN)
        metadata: { invoice_id: 'inv-target-2' },
      });

      const fakeInvoice = {
        id: 'inv-target-2',
        tenant_id: 'valid-tenant-id',
        subtotal: 100000,
        grand_total: 100000,
        amount: 100000, // 100,000 NGN
      };

      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [fakeInvoice], // invoice lookup
        })
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // ref check on rent_payments
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 0 }] }); // sum existing payments

      const { req, res } = createMockReqRes({
        user: { id: 'valid-tenant-id', role: 'tenant' },
        body: { reference: 'PAY_REF_UNDERPAID' },
      });

      await verifyPaystackPayment(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Underpaid amount/i);
    });

    test('verify rejects when currency is not NGN', async () => {
      jest.spyOn(paystackService, 'verifyTransaction').mockResolvedValueOnce({
        status: 'success',
        currency: 'USD',
        amount: 5000000,
        metadata: { invoice_id: 'inv-target-3' },
      });

      const { req, res } = createMockReqRes({
        user: { id: 'valid-tenant-id', role: 'tenant' },
        body: { reference: 'PAY_REF_USD' },
      });

      await verifyPaystackPayment(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Invalid currency/i);
    });

    test('webhook rejects a bad signature and accepts a good one', async () => {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      const validPayload = JSON.stringify({
        event: 'charge.success',
        data: {
          reference: 'WEBHOOK_REF_001',
          amount: 15000000, // 150,000 NGN in kobo
          currency: 'NGN',
          status: 'success',
          metadata: { invoice_id: 'inv-webhook-1' }
        }
      });

      const validRawBuffer = Buffer.from(validPayload, 'utf8');
      const validSignature = crypto.createHmac('sha512', secret).update(validRawBuffer).digest('hex');
      const badSignature = '0'.repeat(128); // invalid hex signature

      // 1. Bad signature test
      {
        const { req, res } = createMockReqRes({
          headers: { 'x-paystack-signature': badSignature },
          body: validRawBuffer,
        });

        await handlePaystackWebhook(req, res);

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/Invalid webhook signature/i);
      }

      // 2. Good signature test
      {
        const fakeInvoice = {
          id: 'inv-webhook-1',
          tenant_id: 'tenant-webhook-1',
          landlord_id: 'landlord-webhook-1',
          property_title: 'Sunny Apartments',
          subtotal: 150000,
          grand_total: 150000,
          amount: 150000,
          status: 'pending',
        };

        const mockClient = {
          query: jest.fn(),
          release: jest.fn(),
        };
        jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

        // Queries inside markInvoicePaidWithPaystackHelper:
        // 1. Existing payment check
        // 2. BEGIN
        // 3. SELECT ... FOR UPDATE
        // 4. INSERT INTO rent_payments
        // 5. UPDATE rent_invoices
        // 6. COMMIT
        mockClient.query
          .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // existing payment check
          .mockResolvedValueOnce({ command: 'BEGIN' })
          .mockResolvedValueOnce({ rowCount: 1, rows: [fakeInvoice] }) // SELECT FOR UPDATE
          .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // locked reference re-check
          .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 0 }] }) // recompute remainingKobo from DB
          .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'payment-1' }] }) // INSERT rent_payments
          .mockResolvedValueOnce({ rowCount: 1, rows: [{ ...fakeInvoice, status: 'paid' }] }) // UPDATE rent_invoices
          .mockResolvedValueOnce({ command: 'COMMIT' });

        // 1. Ref check on rent_payments -> no conflict
        // 2. Invoice lookup by targetInvoiceId
        // 3. Sum existing payments
        // 4. Notification insert
        jest.spyOn(pool, 'query')
          .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // ref check on rent_payments
          .mockResolvedValueOnce({ rowCount: 1, rows: [fakeInvoice] }) // Invoice lookup
          .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 0 }] }) // sum existing
          .mockResolvedValueOnce({ rowCount: 1, rows: [] }); // Notification insert

        const { req, res } = createMockReqRes({
          headers: { 'x-paystack-signature': validSignature },
          body: validRawBuffer,
        });

        await handlePaystackWebhook(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('success');
      }
    });

    test('mark-paid logic is idempotent and does not create duplicate payments for repeated reference', async () => {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      const payload = JSON.stringify({
        event: 'charge.success',
        data: {
          reference: 'WEBHOOK_REPEAT_REF',
          amount: 5000000,
          currency: 'NGN',
          status: 'success',
          metadata: { invoice_id: 'inv-repeat-1' }
        }
      });
      const rawBuffer = Buffer.from(payload, 'utf8');
      const signature = crypto.createHmac('sha512', secret).update(rawBuffer).digest('hex');

      const existingPayment = {
        id: 'payment-existing-1',
        invoice_id: 'inv-repeat-1',
        reference_number: 'WEBHOOK_REPEAT_REF',
        amount: 50000,
      };
      const alreadyPaidInvoice = {
        id: 'inv-repeat-1',
        status: 'paid',
        subtotal: 50000,
        amount: 50000,
      };

      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      // 1. Ref check on rent_payments (same invoice)
      // 2. Invoice lookup by targetInvoiceId
      // 3. Sum existing payments
      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [existingPayment],
        })
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [alreadyPaidInvoice],
        })
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ paid_sum: 50000 }],
        });

      // markInvoicePaidWithPaystackHelper check:
      // existing payment returns 1 row!
      mockClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [existingPayment],
      });

      const { req, res } = createMockReqRes({
        headers: { 'x-paystack-signature': signature },
        body: rawBuffer,
      });

      await handlePaystackWebhook(req, res);

      expect(res.statusCode).toBe(200);

      // Confirm no INSERT INTO rent_payments was executed
      const insertCalls = mockClient.query.mock.calls.filter(call => 
        typeof call[0] === 'string' && call[0].includes('INSERT INTO rent_payments')
      );
      expect(insertCalls.length).toBe(0);
    });

    test('verify rejects an amount less than expected subtotal amount', async () => {
      // Invoice subtotal is 100,000 (10,000,000 kobo).
      // Paystack reports amount less than subtotal: 80,000 (8,000,000 kobo).
      jest.spyOn(paystackService, 'verifyTransaction').mockResolvedValueOnce({
        status: 'success',
        currency: 'NGN',
        amount: 8000000, // 80,000 NGN in kobo (less than subtotal)
        metadata: { invoice_id: 'inv-target-subtotal' },
      });

      const fakeInvoice = {
        id: 'inv-target-subtotal',
        tenant_id: 'valid-tenant-id',
        subtotal: 100000,
        grand_total: 150000,
        amount: 150000,
      };

      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [fakeInvoice], // invoice lookup
        })
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // ref check on rent_payments
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 0 }] }); // sum existing payments

      const { req, res } = createMockReqRes({
        user: { id: 'valid-tenant-id', role: 'tenant' },
        body: { reference: 'PAY_REF_UNDERPAID_SUBTOTAL' },
      });

      await verifyPaystackPayment(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Underpaid amount/i);
    });

    test('webhook returns 500 with generic error message on real processing error after signature validation', async () => {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      const validPayload = JSON.stringify({
        event: 'charge.success',
        data: {
          reference: 'WEBHOOK_ERR_REF',
          amount: 15000000,
          currency: 'NGN',
          status: 'success',
          metadata: { invoice_id: 'inv-webhook-err' }
        }
      });

      const validRawBuffer = Buffer.from(validPayload, 'utf8');
      const validSignature = crypto.createHmac('sha512', secret).update(validRawBuffer).digest('hex');

      // Simulate a real processing/DB failure when querying the invoice
      jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('FATAL: Database connection dropped unexpectedly'));

      const { req, res } = createMockReqRes({
        headers: { 'x-paystack-signature': validSignature },
        body: validRawBuffer,
      });

      await handlePaystackWebhook(req, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Server error processing webhook');
      expect(res.body.error).not.toMatch(/FATAL/i);
      expect(res.body.error).not.toMatch(/connection dropped/i);
    });
  });

  // =========================================================================
  // FIX 1: recordPayment Row Lock and Status Rules (409 on paid, proof submission rules)
  // =========================================================================
  describe('FIX 1: recordPayment Row Locking and Status Rules', () => {
    test('recordPayment locks the invoice row with FOR UPDATE OF ri inside the transaction', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const fakeInvoice = {
        id: 'inv-lock-1',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        status: 'unpaid',
        grand_total: 200000,
        amount: 200000,
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [fakeInvoice] }) // SELECT ... FOR UPDATE OF ri
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ landlord_id: 'landlord-456' }] }) // propCheck
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 0 }] }) // sum existing
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'pay-1', amount: 200000 }] }) // INSERT rent_payments
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ ...fakeInvoice, status: 'paid' }] }) // UPDATE rent_invoices
        .mockResolvedValueOnce({ command: 'COMMIT' });

      jest.spyOn(pool, 'query').mockResolvedValueOnce({ rowCount: 1, rows: [] }); // notification

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-lock-1' },
        user: { id: 'landlord-456', role: 'landlord' },
        body: { amount: 200000 },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(200);
      // Verify row lock was requested on ri
      const invoiceQueryCall = mockClient.query.mock.calls.find(call => 
        typeof call[0] === 'string' && call[0].includes('FOR UPDATE OF ri')
      );
      expect(invoiceQueryCall).toBeDefined();
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('recordPayment returns 409 when invoice.status is already paid for landlord/admin path', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const paidInvoice = {
        id: 'inv-paid-landlord',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        status: 'paid',
        grand_total: 200000,
        amount: 200000,
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [paidInvoice] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ landlord_id: 'landlord-456' }] }) // propCheck
        .mockResolvedValueOnce({ command: 'ROLLBACK' });

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-paid-landlord' },
        user: { id: 'landlord-456', role: 'landlord' },
        body: { amount: 200000 },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toMatch(/Invoice has already been paid/i);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('recordPayment returns 409 when invoice.status is already paid for tenant path', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const paidInvoice = {
        id: 'inv-paid-tenant',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        status: 'paid',
        grand_total: 200000,
        amount: 200000,
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [paidInvoice] })
        .mockResolvedValueOnce({ command: 'ROLLBACK' });

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-paid-tenant' },
        user: { id: 'tenant-123', role: 'tenant' },
        body: { reference: 'PROOF-REF-999' },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toMatch(/Invoice has already been paid/i);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('recordPayment returns 409 when tenant submits proof for invoice with status not in [unpaid, overdue, payment_submitted]', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const cancelledInvoice = {
        id: 'inv-cancelled',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        status: 'cancelled',
        grand_total: 200000,
        amount: 200000,
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [cancelledInvoice] })
        .mockResolvedValueOnce({ command: 'ROLLBACK' });

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-cancelled' },
        user: { id: 'tenant-123', role: 'tenant' },
        body: { reference: 'PROOF-REF-CANCELLED' },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toMatch(/Cannot submit payment proof for invoice with status 'cancelled'/i);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('recordPayment allows tenant proof submission when status is payment_submitted or overdue', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const submittedInvoice = {
        id: 'inv-submitted-1',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        status: 'payment_submitted',
        grand_total: 200000,
        amount: 200000,
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [submittedInvoice] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ ...submittedInvoice, payment_reference: 'NEW-REF-1' }] }) // UPDATE rent_invoices
        .mockResolvedValueOnce({ rowCount: 1, rows: [] }) // notification
        .mockResolvedValueOnce({ command: 'COMMIT' });

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-submitted-1' },
        user: { id: 'tenant-123', role: 'tenant' },
        body: { reference: 'NEW-REF-1' },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/Payment proof submitted successfully/i);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // FIX 2: Partial Payments & Remaining Balance
  // =========================================================================
  describe('FIX 2: Partial Payments and Remaining Balance', () => {
    test('records remaining balance when landlord omits amount on invoice with prior partial payments', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const invoice = {
        id: 'inv-part-rem-1',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        status: 'unpaid',
        grand_total: 250000,
        amount: 250000,
      };

      // Existing payments sum: 100,000 -> remaining: 150,000
      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [invoice] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ landlord_id: 'landlord-456' }] }) // propCheck
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 100000 }] }) // existing paid sum
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'pay-rem', amount: 150000 }] }) // INSERT rent_payments
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ ...invoice, status: 'paid' }] }) // UPDATE rent_invoices
        .mockResolvedValueOnce({ command: 'COMMIT' });

      jest.spyOn(pool, 'query').mockResolvedValueOnce({ rowCount: 1, rows: [] }); // Notification

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-part-rem-1' },
        user: { id: 'landlord-456', role: 'landlord' },
        body: { paymentMethod: 'Bank Transfer' }, // amount omitted
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.payment.amount).toBe(150000);
      expect(res.body.invoice.status).toBe('paid');
      expect(res.body.paid).toBe(true);

      // Verify the INSERT query was called with remaining (150,000)
      const insertCall = mockClient.query.mock.calls.find(call => 
        typeof call[0] === 'string' && call[0].includes('INSERT INTO rent_payments')
      );
      expect(insertCall[1][5]).toBe(150000);
    });

    test('rejects with 400 when payment amount exceeds remaining balance', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const invoice = {
        id: 'inv-part-excess-1',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        status: 'unpaid',
        grand_total: 200000,
        amount: 200000,
      };

      // Existing payments sum: 150,000 -> remaining: 50,000
      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [invoice] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ landlord_id: 'landlord-456' }] }) // propCheck
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 150000 }] }) // existing sum
        .mockResolvedValueOnce({ command: 'ROLLBACK' });

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-part-excess-1' },
        user: { id: 'landlord-456', role: 'landlord' },
        body: { amount: 60000 }, // 60,000 > 50,000 remaining
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/exceeds the remaining invoice balance/i);
      expect(res.body.remaining).toBe(50000);
    });

    test('marks invoice paid when sum + this payment >= expected', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const invoice = {
        id: 'inv-part-complete',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        status: 'unpaid',
        grand_total: 200000,
        amount: 200000,
      };

      // Existing sum: 120,000, paying 80,000 (total = 200,000)
      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [invoice] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ landlord_id: 'landlord-456' }] }) // propCheck
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 120000 }] }) // existing sum
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'pay-final', amount: 80000 }] }) // INSERT rent_payments
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ ...invoice, status: 'paid' }] }) // UPDATE rent_invoices
        .mockResolvedValueOnce({ command: 'COMMIT' });

      jest.spyOn(pool, 'query').mockResolvedValueOnce({ rowCount: 1, rows: [] }); // notification

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-part-complete' },
        user: { id: 'landlord-456', role: 'landlord' },
        body: { amount: 80000, partial: true },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.paid).toBe(true);
      expect(res.body.invoice.status).toBe('paid');
      const updatePaidCall = mockClient.query.mock.calls.find(call => 
        typeof call[0] === 'string' && call[0].includes("UPDATE rent_invoices SET status = 'paid'")
      );
      expect(updatePaidCall).toBeDefined();
    });
  });

  // =========================================================================
  // FIX 3: verifyPaystackPayment and markInvoicePaidWithPaystackHelper
  // =========================================================================
  describe('FIX 3: verifyPaystackPayment and markInvoicePaidWithPaystackHelper Fixes', () => {
    test('verifyPaystackPayment returns 400 when paystackData.metadata.invoice_id is missing', async () => {
      jest.spyOn(paystackService, 'verifyTransaction').mockResolvedValueOnce({
        status: 'success',
        currency: 'NGN',
        amount: 5000000,
        metadata: {}, // missing invoice_id
      });

      const { req, res } = createMockReqRes({
        user: { id: 'tenant-123', role: 'tenant' },
        body: { reference: 'REF-NO-META' },
      });

      await verifyPaystackPayment(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/missing invoice_id/i);
    });

    test('verifyPaystackPayment returns 400 when caller sent invoiceId that does not match metadata.invoice_id', async () => {
      jest.spyOn(paystackService, 'verifyTransaction').mockResolvedValueOnce({
        status: 'success',
        currency: 'NGN',
        amount: 5000000,
        metadata: { invoice_id: 'inv-metadata-123' },
      });

      const { req, res } = createMockReqRes({
        user: { id: 'tenant-123', role: 'tenant' },
        body: { reference: 'REF-MISMATCH', invoiceId: 'inv-caller-456' },
      });

      await verifyPaystackPayment(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Invoice ID does not match transaction metadata/i);
    });

    test('verifyPaystackPayment returns 409 when reference already has rent_payments row for a DIFFERENT invoice', async () => {
      jest.spyOn(paystackService, 'verifyTransaction').mockResolvedValueOnce({
        status: 'success',
        currency: 'NGN',
        amount: 5000000,
        metadata: { invoice_id: 'inv-target-123' },
      });

      // 1. Invoice lookup happens first
      // 2. Reference check happens second
      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id: 'inv-target-123', tenant_id: 'tenant-123', status: 'unpaid', subtotal: 50000, amount: 50000 }],
        })
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id: 'existing-pay-1', invoice_id: 'inv-different-999', reference_number: 'REF-CONFLICT' }],
        });

      const { req, res } = createMockReqRes({
        user: { id: 'tenant-123', role: 'tenant' },
        body: { reference: 'REF-CONFLICT', invoiceId: 'inv-target-123' },
      });

      await verifyPaystackPayment(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toBe("Payment reference 'REF-CONFLICT' has already been applied to a different invoice");
      expect(res.body.error).not.toMatch(/inv-different-999/);
    });

    test('markInvoicePaidWithPaystackHelper alreadyProcessed only advances property_applications when invoice is actually paid', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      // Existing payment found, but invoice status is unpaid
      const unpaidInvoice = {
        id: 'inv-unpaid-app',
        application_id: 'app-test-1',
        status: 'unpaid',
      };
      const existingPayment = {
        id: 'pay-exist-1',
        invoice_id: 'inv-unpaid-app',
        reference_number: 'REF-ALREADY-UNPAID',
      };

      mockClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [existingPayment],
      });

      const result = await markInvoicePaidWithPaystackHelper({
        invoice: unpaidInvoice,
        paystackData: { amount: 5000000 },
        reference: 'REF-ALREADY-UNPAID',
      });

      expect(result.alreadyProcessed).toBe(true);
      expect(result.isPaid).toBe(false);

      // Confirm property_applications was NOT updated to rent_paid
      const appUpdateCalls = mockClient.query.mock.calls.filter(call => 
        typeof call[0] === 'string' && call[0].includes("UPDATE property_applications SET status = 'rent_paid'")
      );
      expect(appUpdateCalls.length).toBe(0);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('verifyPaystackPayment alreadyProcessed response reports paid: false when invoice is not paid', async () => {
      jest.spyOn(paystackService, 'verifyTransaction').mockResolvedValueOnce({
        status: 'success',
        currency: 'NGN',
        amount: 5000000,
        metadata: { invoice_id: 'inv-unpaid-verify' },
      });

      const unpaidInvoice = {
        id: 'inv-unpaid-verify',
        tenant_id: 'tenant-123',
        status: 'unpaid',
        application_id: 'app-unpaid-1',
        subtotal: 50000,
        amount: 50000,
      };

      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      // 1. Invoice lookup
      // 2. Reference check on rent_payments for different invoice -> no conflict (same invoice)
      // 3. Sum existing payments
      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [unpaidInvoice], // invoice lookup
        })
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id: 'pay-1', invoice_id: 'inv-unpaid-verify', reference_number: 'REF-SAME-INV' }],
        })
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ paid_sum: 0 }],
        });

      // markInvoicePaidWithPaystackHelper idempotency check returns existing payment
      mockClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'pay-1', invoice_id: 'inv-unpaid-verify' }],
      });

      const { req, res } = createMockReqRes({
        user: { id: 'tenant-123', role: 'tenant' },
        body: { reference: 'REF-SAME-INV', invoiceId: 'inv-unpaid-verify' },
      });

      await verifyPaystackPayment(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.paid).toBe(false);
      expect(res.body.applicationStatus).not.toBe('rent_paid');
    });

    test('verifyPaystackPayment alreadyProcessed response reports paid: true when invoice is paid', async () => {
      jest.spyOn(paystackService, 'verifyTransaction').mockResolvedValueOnce({
        status: 'success',
        currency: 'NGN',
        amount: 5000000,
        metadata: { invoice_id: 'inv-paid-verify' },
      });

      const paidInvoice = {
        id: 'inv-paid-verify',
        tenant_id: 'tenant-123',
        status: 'paid',
        application_id: 'app-paid-1',
        subtotal: 50000,
        amount: 50000,
      };

      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      // 1. Invoice lookup
      // 2. Reference check -> same invoice
      // 3. Sum existing payments
      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [paidInvoice], // invoice lookup
        })
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id: 'pay-1', invoice_id: 'inv-paid-verify', reference_number: 'REF-PAID-INV' }],
        })
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ paid_sum: 50000 }],
        });

      // markInvoicePaidWithPaystackHelper idempotency check returns existing payment and updates application
      mockClient.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id: 'pay-1', invoice_id: 'inv-paid-verify' }],
        })
        .mockResolvedValueOnce({ rowCount: 1, rows: [] }); // UPDATE property_applications

      const { req, res } = createMockReqRes({
        user: { id: 'tenant-123', role: 'tenant' },
        body: { reference: 'REF-PAID-INV', invoiceId: 'inv-paid-verify' },
      });

      await verifyPaystackPayment(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.paid).toBe(true);
      expect(res.body.applicationStatus).toBe('rent_paid');
    });
  });

  // =========================================================================
  // FIXES ROUND 2: Remaining Balance Charging, Null Status, Webhook Security, Money Handling
  // =========================================================================
  describe('FIXES ROUND 2: Paystack Remaining, Null Status, Webhook Security, Money Handling', () => {
    // Requirement 1
    test('invoice expected 250000 with 100000 already paid -> initialize charges 15000000 kobo', async () => {
      const fakeInvoice = {
        id: 'inv-part-init-1',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        status: 'unpaid',
        subtotal: 250000,
        grand_total: 250000,
        amount: 250000,
        paystack_subaccount_code: 'ACCT_SUB_123',
      };

      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [fakeInvoice], // Invoice lookup
        })
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ paid_sum: 100000 }], // Existing payments sum: 100,000
        });

      jest.spyOn(paystackService, 'initializeTransaction').mockResolvedValueOnce({
        authorization_url: 'https://checkout.paystack.com/auth_test',
        access_code: 'access_code_123',
        reference: 'LODALE_REF_TEST',
      });

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-part-init-1' },
        user: { id: 'tenant-123', email: 'tenant@example.com', role: 'tenant' },
      });

      await initializePaystackPayment(req, res);

      expect(res.statusCode).toBe(200);
      expect(paystackService.initializeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amountKobo: 15000000, // 150,000 NGN in kobo (remaining = 250,000 - 100,000)
          transactionChargeKobo: 525000, // 3.5% platform fee on 150,000 NGN
        })
      );
    });

    test('initializePaystackPayment returns 409 when remaining balance is <= 0', async () => {
      const fakeInvoice = {
        id: 'inv-zero-rem',
        tenant_id: 'tenant-123',
        status: 'unpaid',
        subtotal: 200000,
        grand_total: 200000,
        paystack_subaccount_code: 'ACCT_SUB_123',
      };

      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rowCount: 1, rows: [fakeInvoice] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 200000 }] }); // fully paid via partials

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-zero-rem' },
        user: { id: 'tenant-123', role: 'tenant' },
      });

      await initializePaystackPayment(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toMatch(/no remaining balance/i);
    });

    // Requirement 2
    test('tenant can submit proof when invoice.status is null', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const nullStatusInvoice = {
        id: 'inv-null-status-proof',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        status: null, // treated as 'unpaid'
        grand_total: 200000,
        amount: 200000,
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [nullStatusInvoice] }) // SELECT ... FOR UPDATE OF ri
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ ...nullStatusInvoice, status: 'payment_submitted', payment_reference: 'PROOF-NULL' }] }) // UPDATE rent_invoices
        .mockResolvedValueOnce({ rowCount: 1, rows: [] }) // Notification
        .mockResolvedValueOnce({ command: 'COMMIT' });

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-null-status-proof' },
        user: { id: 'tenant-123', role: 'tenant' },
        body: { reference: 'PROOF-NULL' },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/Payment proof submitted successfully/i);
      expect(mockClient.release).toHaveBeenCalled();
    });

    // Requirement 3
    test('verifyPaystackPayment checks caller authorization BEFORE checking reference applied to different invoice', async () => {
      jest.spyOn(paystackService, 'verifyTransaction').mockResolvedValueOnce({
        status: 'success',
        currency: 'NGN',
        amount: 5000000,
        metadata: { invoice_id: 'inv-auth-before-ref' },
      });

      const fakeInvoice = {
        id: 'inv-auth-before-ref',
        tenant_id: 'owner-tenant-id', // real owner
        subtotal: 50000,
        amount: 50000,
      };

      // Only invoice lookup is called; reference check is never reached because auth returns 403
      jest.spyOn(pool, 'query').mockResolvedValueOnce({
        rowCount: 1,
        rows: [fakeInvoice],
      });

      const { req, res } = createMockReqRes({
        user: { id: 'attacker-id', role: 'tenant' }, // wrong tenant
        body: { reference: 'REF-ANY-DIFFERENT' },
      });

      await verifyPaystackPayment(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toMatch(/Unauthorized: This is not your invoice/i);
    });

    // Requirement 4
    test('handlePaystackWebhook logs warning and returns 200 ignored when metadata.invoice_id is missing', async () => {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      const payload = JSON.stringify({
        event: 'charge.success',
        data: {
          reference: 'WH_NO_META_REF',
          amount: 5000000,
          currency: 'NGN',
          status: 'success',
          metadata: {} // missing invoice_id
        }
      });
      const rawBuffer = Buffer.from(payload, 'utf8');
      const signature = crypto.createHmac('sha512', secret).update(rawBuffer).digest('hex');

      const { req, res } = createMockReqRes({
        headers: { 'x-paystack-signature': signature },
        body: rawBuffer,
      });

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await handlePaystackWebhook(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ignored');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('missing metadata.invoice_id'));
      warnSpy.mockRestore();
    });

    test('handlePaystackWebhook logs warning and returns 200 ignored when reference already applied to a different invoice', async () => {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      const payload = JSON.stringify({
        event: 'charge.success',
        data: {
          reference: 'WH_DIFF_INV_REF',
          amount: 5000000,
          currency: 'NGN',
          status: 'success',
          metadata: { invoice_id: 'inv-target-current' }
        }
      });
      const rawBuffer = Buffer.from(payload, 'utf8');
      const signature = crypto.createHmac('sha512', secret).update(rawBuffer).digest('hex');

      // Reference check query returns payment on different invoice
      jest.spyOn(pool, 'query').mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'existing-p-1', invoice_id: 'inv-other-already-used' }],
      });

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { req, res } = createMockReqRes({
        headers: { 'x-paystack-signature': signature },
        body: rawBuffer,
      });

      await handlePaystackWebhook(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ignored');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('already applied to different invoice'));
      warnSpy.mockRestore();
    });

    // Requirement 5
    test('recordPayment does NOT insert a payment row when remaining is 0 kobo and invoice is not paid; marks invoice paid', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const fakeInvoice = {
        id: 'inv-zero-remaining',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        property_title: 'Apartment 4B',
        status: 'unpaid',
        grand_total: 200000,
        amount: 200000,
      };

      // Existing sum is 200,000 -> remainingKobo is 0
      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [fakeInvoice] }) // SELECT ... FOR UPDATE OF ri
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ landlord_id: 'landlord-456' }] }) // propCheck
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 200000 }] }) // sum existing: 200000
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ ...fakeInvoice, status: 'paid' }] }) // UPDATE rent_invoices SET status = 'paid'
        .mockResolvedValueOnce({ command: 'COMMIT' });

      jest.spyOn(pool, 'query').mockResolvedValueOnce({ rowCount: 1, rows: [] }); // Notification insert

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-zero-remaining' },
        user: { id: 'landlord-456', role: 'landlord' },
        body: { paymentMethod: 'Bank Transfer' },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.paid).toBe(true);
      expect(res.body.payment).toBeNull();
      expect(res.body.invoice.status).toBe('paid');

      // Verify no INSERT into rent_payments was called
      const insertPaymentCalls = mockClient.query.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].includes('INSERT INTO rent_payments')
      );
      expect(insertPaymentCalls.length).toBe(0);

      // Verify UPDATE rent_invoices SET status = 'paid' was called
      const updateInvoiceCalls = mockClient.query.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].includes("UPDATE rent_invoices SET status = 'paid'")
      );
      expect(updateInvoiceCalls.length).toBe(1);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('recordPayment omits applicationStatus when invoice is not linked to an application', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const leaseOnlyInvoice = {
        id: 'inv-lease-only',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        lease_id: 'lease-123',
        application_id: null, // no application
        status: 'unpaid',
        grand_total: 200000,
        amount: 200000,
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [leaseOnlyInvoice] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ landlord_id: 'landlord-456' }] }) // propCheck
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 0 }] }) // existing sum
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'p-lease-1', amount: 200000 }] }) // INSERT rent_payments
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ ...leaseOnlyInvoice, status: 'paid' }] }) // UPDATE rent_invoices
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'lease-123', status: 'signed', tenant_name: 'John Doe', start_date: '2026-01-01', property_id: 'prop-123' }] }) // SELECT lease
        .mockResolvedValueOnce({ rowCount: 1, rows: [] }) // UPDATE lease
        .mockResolvedValueOnce({ rowCount: 1, rows: [] }) // UPDATE property
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'lease-123', start_date: '2026-01-01', end_date: null, status: 'active' }] }) // SELECT lease for renewal check
        .mockResolvedValueOnce({ command: 'COMMIT' });

      jest.spyOn(pool, 'query').mockResolvedValueOnce({ rowCount: 1, rows: [] }); // Notification insert

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-lease-only' },
        user: { id: 'landlord-456', role: 'landlord' },
        body: { amount: 200000 },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.applicationStatus).toBeUndefined();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  // FIXES ROUND 3: Overpayment Review, Webhook Error Handling, Invoice Creation Validation
  describe('FIXES ROUND 3: Overpayment Review, Webhook Error Handling, Invoice Creation Validation', () => {
    test('markInvoicePaidWithPaystackHelper inserts row with duplicate notes, notifies admins and landlord, and returns alreadyProcessed: true when invoice is already paid', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const alreadyPaidInvoice = {
        id: 'inv-already-paid-1',
        landlord_id: 'landlord-already-paid',
        property_title: 'Ocean View Residence',
        invoice_number: 'INV-ALREADY-PAID',
        status: 'paid',
        grand_total: 100000,
        subtotal: 100000,
        amount: 100000,
      };

      // 1. Idempotency check before transaction: reference not found yet
      // 2. BEGIN
      // 3. SELECT ... FOR UPDATE (locked check)
      // 4. INSERT INTO rent_payments
      // 5. COMMIT
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // reference not in rent_payments
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [alreadyPaidInvoice] }) // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // locked reference re-check
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 100000 }] }) // recompute remainingKobo from DB
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            id: 'payment-dup-1',
            invoice_id: 'inv-already-paid-1',
            amount: 100000,
            notes: 'Duplicate/overpayment - needs refund review',
            reference_number: 'PAYSTACK-DUP-REF-1',
          }],
        }) // INSERT rent_payments
        .mockResolvedValueOnce({ command: 'COMMIT' });

      // Admin users lookup + notifications dispatch
      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({
          rowCount: 2,
          rows: [{ id: 'admin-1' }, { id: 'admin-2' }],
        }) // SELECT users WHERE primary_role = 'admin'
        .mockResolvedValueOnce({ rowCount: 1, rows: [] }) // notif 1
        .mockResolvedValueOnce({ rowCount: 1, rows: [] }) // notif 2
        .mockResolvedValueOnce({ rowCount: 1, rows: [] }); // notif 3

      const result = await markInvoicePaidWithPaystackHelper({
        invoice: alreadyPaidInvoice,
        paystackData: { amount: 10000000, paid_at: new Date().toISOString() },
        reference: 'PAYSTACK-DUP-REF-1',
      });

      expect(result.alreadyProcessed).toBe(true);
      expect(result.isPaid).toBe(true);
      expect(result.payment).toBeDefined();
      expect(result.payment.notes).toBe('Duplicate/overpayment - needs refund review');

      // Verify UPDATE rent_invoices was NOT called
      const invoiceUpdateCalls = mockClient.query.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].includes('UPDATE rent_invoices')
      );
      expect(invoiceUpdateCalls.length).toBe(0);

      // Verify notifications were inserted for both admins and landlord
      const notifCalls = pool.query.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].includes('INSERT INTO notifications')
      );
      expect(notifCalls.length).toBe(3); // 2 admins + 1 landlord
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('markInvoicePaidWithPaystackHelper records full Paystack amount and mentions overpaid amount in notes when payment exceeds remaining balance', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const unpaidInvoice = {
        id: 'inv-overpaid-1',
        landlord_id: 'landlord-overpaid',
        property_title: 'Sunset Villa',
        invoice_number: 'INV-OVERPAID-1',
        status: 'unpaid',
        grand_total: 100000,
        subtotal: 100000,
        amount: 100000,
      };

      // Remaining balance is 50,000 NGN (5,000,000 kobo), but Paystack reports 70,000 NGN (7,000,000 kobo)
      // Overpayment: 20,000 NGN
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // ref check
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [unpaidInvoice] }) // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // locked reference re-check
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 50000 }] }) // recompute remainingKobo from DB: 100000 - 50000 = 50000 NGN
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            id: 'payment-over-1',
            invoice_id: 'inv-overpaid-1',
            amount: 70000, // full Paystack amount
            notes: 'Paid via Paystack gateway split transaction (Overpayment of ₦20,000 - needs refund review)',
            reference_number: 'PAYSTACK-OVER-REF',
          }],
        }) // INSERT rent_payments
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ ...unpaidInvoice, status: 'paid' }] }) // UPDATE rent_invoices
        .mockResolvedValueOnce({ command: 'COMMIT' });

      // Admin users lookup for overpayment notice
      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rowCount: 1, rows: [] }) // landlord/tenant notification
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'admin-over-1' }] }) // admin lookup
        .mockResolvedValueOnce({ rowCount: 1, rows: [] }); // admin notification

      const result = await markInvoicePaidWithPaystackHelper({
        invoice: unpaidInvoice,
        paystackData: { amount: 7000000 },
        reference: 'PAYSTACK-OVER-REF',
        remainingKobo: 5000000,
      });

      expect(result.alreadyProcessed).toBe(false);
      expect(result.payment.amount).toBe(70000); // Full amount recorded
      expect(result.payment.notes).toMatch(/Overpayment of ₦20,000/i);

      // Verify the INSERT query received the full amount and notes mentioning overpayment
      const insertCall = mockClient.query.mock.calls.find(call =>
        typeof call[0] === 'string' && call[0].includes('INSERT INTO rent_payments')
      );
      expect(insertCall).toBeDefined();
      expect(insertCall[1][5]).toBe(70000); // amount parameter
      expect(insertCall[1][9]).toMatch(/Overpayment of ₦20,000/i); // notes parameter
    });

    test('handlePaystackWebhook console.error with reference and amount, returning 200 ignored when invoice not found', async () => {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      const payload = JSON.stringify({
        event: 'charge.success',
        data: {
          reference: 'WH_REF_NOT_FOUND',
          amount: 5000000,
          currency: 'NGN',
          status: 'success',
          metadata: { invoice_id: 'inv-non-existent' }
        }
      });
      const rawBuffer = Buffer.from(payload, 'utf8');
      const signature = crypto.createHmac('sha512', secret).update(rawBuffer).digest('hex');

      // Reference check query returns no conflict
      // Invoice lookup query returns 0 rows (not found)
      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // ref check
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }); // invoice lookup not found

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { req, res } = createMockReqRes({
        headers: { 'x-paystack-signature': signature },
        body: rawBuffer,
      });

      await handlePaystackWebhook(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ignored');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Invoice not found for reference WH_REF_NOT_FOUND, amount 5000000/i)
      );
      errorSpy.mockRestore();
    });

    test('handlePaystackWebhook console.error with invoice id, expected and received kobo, returning 200 ignored for underpaid payment', async () => {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      const payload = JSON.stringify({
        event: 'charge.success',
        data: {
          reference: 'WH_REF_UNDERPAID',
          amount: 3000000, // 30,000 NGN = 3,000,000 kobo
          currency: 'NGN',
          status: 'success',
          metadata: { invoice_id: 'inv-underpaid-target' }
        }
      });
      const rawBuffer = Buffer.from(payload, 'utf8');
      const signature = crypto.createHmac('sha512', secret).update(rawBuffer).digest('hex');

      const targetInvoice = {
        id: 'inv-underpaid-target',
        subtotal: 100000,
        grand_total: 100000,
        amount: 100000,
        status: 'unpaid',
      };

      // 1. Reference check query -> no conflict
      // 2. Invoice lookup -> found target invoice (expected 100,000 NGN = 10,000,000 kobo)
      // 3. Sum existing payments -> 0 (remaining 10,000,000 kobo)
      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // ref check
        .mockResolvedValueOnce({ rowCount: 1, rows: [targetInvoice] }) // invoice lookup
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 0 }] }); // sum existing

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { req, res } = createMockReqRes({
        headers: { 'x-paystack-signature': signature },
        body: rawBuffer,
      });

      await handlePaystackWebhook(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ignored');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Underpaid payment for invoice inv-underpaid-target: expected 10000000 kobo, received 3000000 kobo/i)
      );
      errorSpy.mockRestore();
    });

    test('createInvoice rejects with 400 when computed totalPayable is <= 0', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const { req, res } = createMockReqRes({
        user: { id: 'landlord-123', role: 'landlord' },
        body: {
          amount: 0,
          subtotal: 0,
          grandTotal: 0,
          items: [],
        },
      });

      await createInvoice(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/total payable must be greater than 0/i);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('applyLeaseRenewalIfApplicable returns early when lease query returns rowCount: 0', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const invoiceWithMissingLease = {
        id: 'inv-missing-lease',
        tenant_id: 'tenant-123',
        landlord_id: 'landlord-456',
        property_id: 'prop-123',
        lease_id: 'lease-non-existent',
        status: 'unpaid',
        grand_total: 100000,
        amount: 100000,
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [invoiceWithMissingLease] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ landlord_id: 'landlord-456' }] }) // propCheck
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 0 }] }) // existing sum
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'p-1', amount: 100000 }] }) // INSERT rent_payments
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ ...invoiceWithMissingLease, status: 'paid' }] }) // UPDATE rent_invoices
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // SELECT lease for activation -> not found
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // SELECT lease for renewal check -> rowCount: 0
        .mockResolvedValueOnce({ command: 'COMMIT' });

      jest.spyOn(pool, 'query').mockResolvedValueOnce({ rowCount: 1, rows: [] }); // Notification insert

      const { req, res } = createMockReqRes({
        params: { invoiceId: 'inv-missing-lease' },
        user: { id: 'landlord-456', role: 'landlord' },
        body: { amount: 100000 },
      });

      await recordPayment(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.paid).toBe(true);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  // FIXES ROUND 4: Paystack Helper Race Condition, 23505 Unique Violation, Receipts, createInvoice 409
  describe('FIXES ROUND 4: Paystack Helper Race Condition, 23505 Unique Violation, Receipts, createInvoice 409', () => {
    test('(a) second call with same reference finds payment after lock -> exactly one insert into rent_payments and no admin notification', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);
      const poolQuerySpy = jest.spyOn(pool, 'query');

      const invoice = {
        id: 'inv-concurrent-1',
        landlord_id: 'landlord-c1',
        property_title: 'Downtown Apartment',
        invoice_number: 'INV-CONCURRENT-1',
        status: 'paid', // Marked paid by first concurrent call
        grand_total: 150000,
        subtotal: 150000,
        amount: 150000,
      };

      const existingPaymentFromFirstCall = {
        id: 'pay-first-call-1',
        invoice_id: 'inv-concurrent-1',
        amount: 150000,
        reference_number: 'REF-CONCURRENT-123',
        payment_method: 'Paystack',
        notes: 'Paid via Paystack gateway split transaction',
      };

      // Second call query trace:
      // 1. Idempotency check before transaction: returns 0 rows (passed before first call committed)
      // 2. BEGIN
      // 3. SELECT * FROM rent_invoices WHERE id = $1 FOR UPDATE
      // 4. SELECT * FROM rent_payments WHERE reference_number = $1 LIMIT 1 (finds payment inserted by first call)
      // 5. COMMIT
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // initial check passed
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [invoice] }) // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rowCount: 1, rows: [existingPaymentFromFirstCall] }) // locked re-check finds payment!
        .mockResolvedValueOnce({ command: 'COMMIT' });

      const result = await markInvoicePaidWithPaystackHelper({
        invoice,
        paystackData: { amount: 15000000, paid_at: new Date().toISOString() },
        reference: 'REF-CONCURRENT-123',
      });

      expect(result.alreadyProcessed).toBe(true);
      expect(result.isPaid).toBe(true);
      expect(result.payment).toEqual(existingPaymentFromFirstCall);

      // Verify no duplicate payment INSERT occurred
      const insertCalls = mockClient.query.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].includes('INSERT INTO rent_payments')
      );
      expect(insertCalls.length).toBe(0);

      // Verify no admin/landlord duplicate notification queries dispatched
      const notifCalls = poolQuerySpy.mock.calls.filter(call =>
        typeof call[0] === 'string' && call[0].includes('INSERT INTO notifications')
      );
      expect(notifCalls.length).toBe(0);

      expect(mockClient.release).toHaveBeenCalled();
    });

    test('(b) 23505 on insert returns alreadyProcessed', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const invoice = {
        id: 'inv-uniq-violation-1',
        landlord_id: 'landlord-u1',
        property_title: 'Midtown Loft',
        invoice_number: 'INV-UNIQ-1',
        status: 'unpaid',
        grand_total: 100000,
        subtotal: 100000,
        amount: 100000,
      };

      const existingPayment = {
        id: 'pay-existing-23505',
        invoice_id: 'inv-uniq-violation-1',
        amount: 100000,
        reference_number: 'REF-UNIQ-23505',
        payment_method: 'Paystack',
        notes: 'Paid via Paystack gateway split transaction',
      };

      const updatedInvoice = {
        ...invoice,
        status: 'paid',
      };

      const uniqueErr = new Error('duplicate key value violates unique constraint "rent_payments_paystack_ref_uniq"');
      uniqueErr.code = '23505';
      uniqueErr.constraint = 'rent_payments_paystack_ref_uniq';

      // Trace for unique violation:
      // 1. Initial check: rowCount: 0
      // 2. BEGIN
      // 3. SELECT FOR UPDATE: invoice (status unpaid)
      // 4. Locked check: rowCount: 0
      // 5. Recompute remainingKobo from DB: rowCount: 1, paid_sum: 0
      // 6. INSERT INTO rent_payments: throws 23505
      // 7. ROLLBACK
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // pre-lock check
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [invoice] }) // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // locked check
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 0 }] }) // recompute remainingKobo from DB
        .mockRejectedValueOnce(uniqueErr) // INSERT throws 23505
        .mockResolvedValueOnce({ command: 'ROLLBACK' }); // ROLLBACK in catch

      // Re-read queries on pool:
      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rowCount: 1, rows: [existingPayment] }) // SELECT rent_payments
        .mockResolvedValueOnce({ rowCount: 1, rows: [updatedInvoice] }); // SELECT rent_invoices

      const result = await markInvoicePaidWithPaystackHelper({
        invoice,
        paystackData: { amount: 10000000, paid_at: new Date().toISOString() },
        reference: 'REF-UNIQ-23505',
      });

      expect(result.alreadyProcessed).toBe(true);
      expect(result.isPaid).toBe(true);
      expect(result.payment).toEqual(existingPayment);
      expect(result.invoice).toEqual(updatedInvoice);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('(c) createInvoice returns 409 when updating existing application invoice with status payment_submitted', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const appData = {
        id: 'app-sub-1',
        property_id: 'prop-1',
        tenant_id: 'tenant-1',
        status: 'payment_pending',
        landlord_id: 'landlord-1',
        property_title: 'Green Villa',
      };

      const existingInvoice = {
        id: 'inv-existing-sub',
        application_id: 'app-sub-1',
        status: 'payment_submitted',
        invoice_number: 'INV-001',
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [appData] }) // SELECT application
        .mockResolvedValueOnce({ rowCount: 1, rows: [existingInvoice] }) // SELECT existing invoice
        .mockResolvedValueOnce({ command: 'ROLLBACK' });

      const { req, res } = createMockReqRes({
        user: { id: 'landlord-1', role: 'landlord' },
        body: {
          applicationId: 'app-sub-1',
          amount: 200000,
        },
      });

      await createInvoice(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toMatch(/Payment proof has already been submitted/i);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('(c) createInvoice returns 409 when updating existing application invoice that already has rent_payments', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const appData = {
        id: 'app-paid-1',
        property_id: 'prop-1',
        tenant_id: 'tenant-1',
        status: 'payment_pending',
        landlord_id: 'landlord-1',
        property_title: 'Green Villa',
      };

      const existingInvoice = {
        id: 'inv-existing-with-payments',
        application_id: 'app-paid-1',
        status: 'unpaid',
        invoice_number: 'INV-002',
      };

      mockClient.query
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [appData] }) // SELECT application
        .mockResolvedValueOnce({ rowCount: 1, rows: [existingInvoice] }) // SELECT existing invoice
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'payment-1' }] }) // SELECT 1 FROM rent_payments
        .mockResolvedValueOnce({ command: 'ROLLBACK' });

      const { req, res } = createMockReqRes({
        user: { id: 'landlord-1', role: 'landlord' },
        body: {
          applicationId: 'app-paid-1',
          amount: 200000,
        },
      });

      await createInvoice(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toMatch(/Payments have already been recorded/i);
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('(d) getLandlordReceipts excludes rows whose notes contain Duplicate/overpayment', async () => {
      const normalReceipt = {
        payment_id: 'pay-1',
        id: 'pay-1',
        amount: 250000,
        notes: 'Paid via Paystack gateway split transaction',
        invoice_items: JSON.stringify([{ description: 'Rent', amount: 250000 }]),
      };

      const duplicateReceipt = {
        payment_id: 'pay-2',
        id: 'pay-2',
        amount: 250000,
        notes: 'Duplicate/overpayment - needs refund review',
        invoice_items: '[]',
      };

      jest.spyOn(pool, 'query').mockResolvedValueOnce({
        rows: [normalReceipt, duplicateReceipt],
        rowCount: 2,
      });

      const { req, res } = createMockReqRes({
        user: { id: 'landlord-1', role: 'landlord' },
      });

      await getLandlordReceipts(req, res);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].paymentId).toBe('pay-1');
      expect(res.body.some(r => r.notes && r.notes.includes('Duplicate/overpayment'))).toBe(false);
    });

    test('markInvoicePaidWithPaystackHelper rethrows 23505 when err.constraint is not rent_payments_paystack_ref_uniq', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const invoice = {
        id: 'inv-other-constraint-1',
        landlord_id: 'landlord-oc1',
        status: 'unpaid',
        grand_total: 100000,
        subtotal: 100000,
        amount: 100000,
      };

      const otherConstraintErr = new Error('duplicate key value violates unique constraint "some_other_uniq_constraint"');
      otherConstraintErr.code = '23505';
      otherConstraintErr.constraint = 'some_other_uniq_constraint';

      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // pre-lock check
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [invoice] }) // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // locked check
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 0 }] }) // recompute remainingKobo from DB
        .mockRejectedValueOnce(otherConstraintErr) // INSERT throws with other constraint
        .mockResolvedValueOnce({ command: 'ROLLBACK' }); // ROLLBACK in catch

      await expect(
        markInvoicePaidWithPaystackHelper({
          invoice,
          paystackData: { amount: 10000000, paid_at: new Date().toISOString() },
          reference: 'REF-OTHER-CONSTRAINT',
        })
      ).rejects.toThrow('duplicate key value violates unique constraint "some_other_uniq_constraint"');

      expect(mockClient.release).toHaveBeenCalled();
    });

    test('markInvoicePaidWithPaystackHelper recomputes remainingKobo from DB inside transaction and ignores passed-in remainingKobo to decide overpayment', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      jest.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const invoice = {
        id: 'inv-recompute-over-1',
        landlord_id: 'landlord-rec-1',
        property_title: 'Crown Tower',
        invoice_number: 'INV-REC-1',
        status: 'unpaid',
        grand_total: 200000,
        subtotal: 200000,
        amount: 200000,
      };

      // In this test:
      // Caller passes remainingKobo: 20000000 (200,000 NGN)
      // But inside the transaction, DB returns paid_sum: 150000 (150,000 NGN partial payment recorded after pre-check)
      // Recomputed remaining balance: 200,000 - 150,000 = 50,000 NGN (5,000,000 kobo)
      // Paystack reports payment of 80,000 NGN (8,000,000 kobo)
      // Overpayment: 80,000 - 50,000 = 30,000 NGN (3,000,000 kobo)
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // pre-lock check
        .mockResolvedValueOnce({ command: 'BEGIN' })
        .mockResolvedValueOnce({ rowCount: 1, rows: [invoice] }) // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // locked reference re-check
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_sum: 150000 }] }) // DB returns 150,000 already paid
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            id: 'payment-rec-over',
            invoice_id: 'inv-recompute-over-1',
            amount: 80000,
            notes: 'Paid via Paystack gateway split transaction (Overpayment of ₦30,000 - needs refund review)',
            reference_number: 'REF-RECOMPUTE-OVER',
          }],
        }) // INSERT rent_payments
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ ...invoice, status: 'paid' }] }) // UPDATE rent_invoices
        .mockResolvedValueOnce({ command: 'COMMIT' });

      // Notifications dispatch
      jest.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rowCount: 1, rows: [] }) // landlord/tenant notification
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'admin-rec-1' }] }) // admin lookup
        .mockResolvedValueOnce({ rowCount: 1, rows: [] }); // admin overpayment notification

      const result = await markInvoicePaidWithPaystackHelper({
        invoice,
        paystackData: { amount: 8000000, paid_at: new Date().toISOString() },
        reference: 'REF-RECOMPUTE-OVER',
        remainingKobo: 20000000, // Stale passed-in value, should be ignored!
      });

      expect(result.alreadyProcessed).toBe(false);
      expect(result.invoice.status).toBe('paid');

      // Verify the payment insert query received notes with the correct overpayment calculated from DB remaining
      const insertCall = mockClient.query.mock.calls.find(call =>
        typeof call[0] === 'string' && call[0].includes('INSERT INTO rent_payments')
      );
      expect(insertCall).toBeDefined();
      expect(insertCall[1][9]).toContain('Overpayment of ₦30,000 - needs refund review');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
