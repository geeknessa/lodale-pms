import express from 'express';
import { propertyController } from '../controllers/propertyController.js';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createPropertySchema, idParamSchema, propertyActionSchema } from '../utils/validationSchemas.js';
import { z } from 'zod';

const router = express.Router();

const updatePropertyStatusSchema = z.object({
  status: z.string().min(1, "Status is required")
});

const landlordIdParamSchema = z.object({ landlordId: z.string().min(1) });

// Add query schema for getProperties (basic validation for allowed filters)
const getPropertiesQuerySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  bedrooms: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
}).catchall(z.string().optional()); // catchall allows other query params to pass through for now

router.get('/', validate({ query: getPropertiesQuerySchema }), propertyController.getProperties);
router.get('/landlord/:landlordId', requireAuth, requireRole('landlord'), validate({ params: landlordIdParamSchema }), propertyController.getPropertiesByLandlord);
router.get('/saved', requireAuth, propertyController.getSavedProperties);
router.get('/:id', validate({ params: idParamSchema }), propertyController.getPropertyById);
router.post('/', requireAuth, requireRole('landlord'), validate({ body: createPropertySchema }), propertyController.createProperty);
router.put('/:id', requireAuth, requireRole('landlord'), validate({ params: idParamSchema, body: createPropertySchema.partial() }), propertyController.updateProperty);
router.patch('/:id/status', requireAuth, requireRole('landlord'), validate({ params: idParamSchema, body: updatePropertyStatusSchema }), propertyController.updatePropertyStatus);
router.post('/:id/request-deletion', requireAuth, requireRole('landlord'), validate({ params: idParamSchema, body: propertyActionSchema }), propertyController.requestPropertyDeletion);
router.post('/:id/request-suspension', requireAuth, requireRole('landlord'), validate({ params: idParamSchema, body: propertyActionSchema }), propertyController.requestPropertySuspension);
router.post('/:id/save', requireAuth, validate({ params: idParamSchema }), propertyController.saveProperty);
router.delete('/:id/save', requireAuth, validate({ params: idParamSchema }), propertyController.unsaveProperty);
router.delete('/:id', requireAuth, requireRole('landlord'), validate({ params: idParamSchema }), propertyController.deleteProperty);

export default router;
