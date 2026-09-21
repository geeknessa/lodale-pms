import express from 'express';
import { getMyInspections, createInspection, updateInspection } from '../controllers/inspectionController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { idParamSchema } from '../utils/validationSchemas.js';
import { z } from 'zod';

const router = express.Router();

const createInspectionSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  tenantId: z.string().min(1, "Tenant ID is required"),
  applicationId: z.string().optional().nullable(),
  date: z.string().min(1, "Date is required"),
  time: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional()
});

const updateInspectionSchema = z.object({
  status: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  notes: z.string().optional()
});

router.use(requireAuth);

router.get('/', getMyInspections);
router.post('/', validate({ body: createInspectionSchema }), createInspection);
router.patch('/:id', validate({ params: idParamSchema, body: updateInspectionSchema }), updateInspection);

export default router;
