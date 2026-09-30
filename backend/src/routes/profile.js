import express from 'express';
import { profileController } from '../controllers/profileController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { z } from 'zod';
import { idParamSchema } from '../utils/validationSchemas.js';

const router = express.Router();

const updateProfileSchema = z.object({
  // Landlord fields
  business_name: z.string().optional().nullable(),
  business_type: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_account_number: z.string().optional().nullable(),
  bank_account_name: z.string().optional().nullable(),
  total_properties_managed: z.union([z.number(), z.string().transform(Number)]).optional().nullable(),
  years_in_business: z.union([z.number(), z.string().transform(Number)]).optional().nullable(),
  professional_license: z.string().optional().nullable(),
  website_url: z.string().optional().nullable(),
  // Tenant fields
  occupation: z.string().optional().nullable(),
  employment_status: z.string().optional().nullable(),
  employer_name: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
  monthly_income: z.string().optional().nullable(),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  emergency_contact_relationship: z.string().optional().nullable(),
  previous_landlord_name: z.string().optional().nullable(),
  previous_landlord_phone: z.string().optional().nullable(),
  marital_status: z.string().optional().nullable(),
  dependents_count: z.union([z.number(), z.string().transform(Number)]).optional().nullable(),
  has_pets: z.boolean().optional().nullable().or(z.string().transform(val => val === 'true')),
  pet_details: z.string().optional().nullable(),
  smoker: z.boolean().optional().nullable().or(z.string().transform(val => val === 'true')),
  gender: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  bio: z.string().optional().nullable()
});

const userIdParamSchema = z.object({ userId: z.string().min(1) });

// ── Authenticated user's own role-specific profile ──
router.get('/', requireAuth, profileController.getMyProfile);
router.put('/', requireAuth, validate({ body: updateProfileSchema }), profileController.updateMyProfile);

// ── Admin-only: look up any user's role-specific profile ──
router.get('/landlord/:userId', requireAuth, requireRole('admin'), validate({ params: userIdParamSchema }), profileController.getLandlordProfileById);
router.get('/tenant/:userId', requireAuth, requireRole('admin'), validate({ params: userIdParamSchema }), profileController.getTenantProfileById);

export default router;
