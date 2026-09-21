import express from 'express';
import { profileController } from '../controllers/profileController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { z } from 'zod';
import { idParamSchema } from '../utils/validationSchemas.js';

const router = express.Router();

const updateProfileSchema = z.object({
  // Landlord fields
  business_name: z.string().optional(),
  business_type: z.string().optional(),
  tax_id: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_account_name: z.string().optional(),
  total_properties_managed: z.union([z.number(), z.string().transform(Number)]).optional(),
  years_in_business: z.union([z.number(), z.string().transform(Number)]).optional(),
  professional_license: z.string().optional(),
  website_url: z.string().optional(),
  // Tenant fields
  occupation: z.string().optional(),
  employment_status: z.string().optional(),
  employer_name: z.string().optional(),
  job_title: z.string().optional(),
  monthly_income: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  previous_landlord_name: z.string().optional(),
  previous_landlord_phone: z.string().optional(),
  marital_status: z.string().optional(),
  dependents_count: z.union([z.number(), z.string().transform(Number)]).optional(),
  has_pets: z.boolean().optional().or(z.string().transform(val => val === 'true')),
  pet_details: z.string().optional(),
  smoker: z.boolean().optional().or(z.string().transform(val => val === 'true')),
  gender: z.string().optional(),
  address: z.string().optional(),
  location: z.string().optional(),
  postal_code: z.string().optional(),
  date_of_birth: z.string().optional(),
  bio: z.string().optional()
});

const userIdParamSchema = z.object({ userId: z.string().min(1) });

// ── Authenticated user's own role-specific profile ──
router.get('/', requireAuth, profileController.getMyProfile);
router.put('/', requireAuth, validate({ body: updateProfileSchema }), profileController.updateMyProfile);

// ── Admin-only: look up any user's role-specific profile ──
router.get('/landlord/:userId', requireAuth, requireRole('admin'), validate({ params: userIdParamSchema }), profileController.getLandlordProfileById);
router.get('/tenant/:userId', requireAuth, requireRole('admin'), validate({ params: userIdParamSchema }), profileController.getTenantProfileById);

export default router;
