import express from 'express';
import { propertyController } from '../controllers/propertyController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createPropertySchema } from '../utils/validationSchemas.js';

const router = express.Router();

router.get('/', propertyController.getProperties);
router.get('/landlord/:landlordId', requireAuth, requireRole('landlord'), propertyController.getPropertiesByLandlord);
router.get('/:id', propertyController.getPropertyById);
router.post('/', requireAuth, requireRole('landlord'), validate(createPropertySchema), propertyController.createProperty);
router.put('/:id', requireAuth, requireRole('landlord'), propertyController.updateProperty);
router.delete('/:id', requireAuth, requireRole('landlord'), propertyController.deleteProperty);

export default router;
