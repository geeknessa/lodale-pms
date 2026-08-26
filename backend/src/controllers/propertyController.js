import { PropertyModel } from '../models/propertyModel.js';
import { UserModel } from '../models/userModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const propertyController = {
  getProperties: asyncHandler(async (req, res) => {
    const properties = await PropertyModel.getProperties(req.query);

    const formatted = await Promise.all(properties.map(async p => {
      const amenities = await PropertyModel.getAmenities(p.id);
      const coverImage = await PropertyModel.getCoverImage(p.id);
      const landlord = await UserModel.findById(p.landlord_id);
      
      let parsedImages = [];
      try { parsedImages = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []); } catch(e) {}
      
      const actualCoverImage = p.cover_image || coverImage || (parsedImages.length > 0 ? parsedImages[0] : null) || '/src/assets/skyline_apartment.png';

      return {
        ...p,
        amenities,
        images: parsedImages,
        cover_image: actualCoverImage,
        price: `₦${Number(p.rent_amount).toLocaleString()}${String(p.rent_period || '').toLowerCase().includes('month') ? '/mo' : '/yr'}`,
        location: `${p.address_line1}, ${p.city}`,
        landlord: landlord ? { 
          id: landlord.id, 
          name: `${landlord.first_name || ''} ${landlord.last_name || ''}`.trim() || 'Verified Landlord' 
        } : null
      };
    }));

    res.json(formatted);
  }),

  getPropertiesByLandlord: asyncHandler(async (req, res) => {
    const { landlordId } = req.params;
    const properties = await PropertyModel.getPropertiesByLandlord(landlordId);

    const formatted = await Promise.all(properties.map(async p => {
      const amenities = await PropertyModel.getAmenities(p.id);
      const adminNotes = await PropertyModel.getRejectionReason(p.id);
      const blocks = await PropertyModel.getBlocks(p.id);
      const units = await PropertyModel.getUnits(p.id);
      const landlord = await UserModel.findById(p.landlord_id);

      let parsedImages = [];
      try { parsedImages = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []); } catch(e) {}
      
      const actualCoverImage = p.cover_image || (parsedImages.length > 0 ? parsedImages[0] : null) || '/src/assets/skyline_apartment.png';

      return {
        ...p,
        amenities,
        blocks,
        units,
        images: parsedImages,
        cover_image: actualCoverImage,
        admin_notes: adminNotes,
        price: `₦${Number(p.rent_amount).toLocaleString()}${String(p.rent_period || '').toLowerCase().includes('month') ? '/mo' : '/yr'}`,
        location: `${p.address_line1}, ${p.city}`,
        landlord: landlord ? { 
          id: landlord.id, 
          name: `${landlord.first_name || ''} ${landlord.last_name || ''}`.trim() || 'Verified Landlord' 
        } : null
      };
    }));

    res.json(formatted);
  }),

  getPropertyById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const property = await PropertyModel.findByIdOrSlug(id);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const amenities = await PropertyModel.getAmenities(property.id);
    const blocks = await PropertyModel.getBlocks(property.id);
    const units = await PropertyModel.getUnits(property.id);
    const landlord = await UserModel.findById(property.landlord_id);
    
    let landlordResponse = null;
    if (landlord) {
       landlordResponse = {
          id: landlord.id,
          name: `${landlord.first_name || ''} ${landlord.last_name || ''}`.trim() || 'Verified Landlord',
          first_name: landlord.first_name,
          last_name: landlord.last_name
       };
    }

    let parsedImages = [];
    try { parsedImages = typeof property.images === 'string' ? JSON.parse(property.images) : (property.images || []); } catch(e) {}
    
    // Also try to get from PropertyModel if there's a property_images table
    const coverImage = await PropertyModel.getCoverImage(property.id);
    const actualCoverImage = property.cover_image || coverImage || (parsedImages.length > 0 ? parsedImages[0] : null) || '/src/assets/skyline_apartment.png';

    res.json({
      ...property,
      amenities,
      blocks,
      units,
      images: parsedImages,
      cover_image: actualCoverImage,
      landlord: landlordResponse,
      price: `₦${Number(property.rent_amount).toLocaleString()}${String(property.rent_period || '').toLowerCase().includes('month') ? '/mo' : '/yr'}`,
      location: `${property.address_line1}, ${property.city}`,
    });
  }),

  createProperty: asyncHandler(async (req, res) => {
    const { 
      title, description, address_line1, city, state, rent_amount, 
      bedrooms, bathrooms, property_type, amenities, 
      ownership_doc, ownership_doc_url, ownership_doc_type, latitude, longitude,
      rules, images, cover_image, blocks, units 
    } = req.body;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const effectiveLandlordId = req.user ? req.user.id : req.body.landlord_id;
    if (!effectiveLandlordId) {
      return res.status(401).json({ error: 'Unauthorized: Landlord identity required' });
    }
    const sanitizedPropertyType = (property_type || 'single_house').toString().trim().toLowerCase().replace(/\s+/g, '_');

    const property = await PropertyModel.createProperty({
      effectiveLandlordId, title, slug, description, sanitizedPropertyType, 
      address_line1, city, state, bedrooms, bathrooms, rent_amount, status: 'pending_review', 
      ownership_doc, ownership_doc_url, ownership_doc_type, latitude, longitude,
      rules, images, cover_image, blocks, units
    });

    if (Array.isArray(amenities) && amenities.length > 0) {
      for (const amenity of amenities) {
        await PropertyModel.addAmenity(property.id, amenity);
      }
    }

    await PropertyModel.queueForApproval(property.id, effectiveLandlordId);

    const createdBlocks = await PropertyModel.getBlocks(property.id);
    const createdUnits = await PropertyModel.getUnits(property.id);

    res.status(201).json({
      ...property,
      blocks: createdBlocks,
      units: createdUnits,
      status: 'pending_review',
      message: 'Property submitted successfully! It is now pending admin review before going live.'
    });
  }),

  updateProperty: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existingProperty = await PropertyModel.findByIdOrSlug(id);
    if (!existingProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (existingProperty.landlord_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You can only update your own properties' });
    }

    const data = req.body;
    
    // Quick sanitization of price from rent string to number if needed, but only if rent_amount isn't explicitly provided
    if (data.price && !data.rent_amount) {
      data.rent_amount = Number(String(data.price).replace(/[^0-9]/g, "")) || 0;
    }

    const updated = await PropertyModel.updateProperty(id, data);
    if (!updated) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Fetch associated data to return a fully populated property object
    const amenities = await PropertyModel.getAmenities(updated.id);
    const blocks = await PropertyModel.getBlocks(updated.id);
    const units = await PropertyModel.getUnits(updated.id);
    
    let parsedImages = [];
    try { parsedImages = typeof updated.images === 'string' ? JSON.parse(updated.images) : (updated.images || []); } catch(e) {}
    
    const coverImage = await PropertyModel.getCoverImage(updated.id);
    const actualCoverImage = updated.cover_image || coverImage || (parsedImages.length > 0 ? parsedImages[0] : null) || '/src/assets/skyline_apartment.png';

    res.json({
      ...updated,
      amenities,
      blocks,
      units,
      images: parsedImages,
      cover_image: actualCoverImage,
      price: `₦${Number(updated.rent_amount).toLocaleString()}${String(updated.rent_period || '').toLowerCase().includes('month') ? '/mo' : '/yr'}`,
      location: `${updated.address_line1}, ${updated.city}`,
    });
  }),

  deleteProperty: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existingProperty = await PropertyModel.findByIdOrSlug(id);
    if (!existingProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (existingProperty.landlord_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own properties' });
    }

    await PropertyModel.deleteProperty(id);
    res.json({ message: 'Property deleted successfully' });
  }),

  updatePropertyStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const existingProperty = await PropertyModel.findByIdOrSlug(id);
    if (!existingProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (existingProperty.landlord_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You can only update status of your own properties' });
    }

    const updated = await PropertyModel.updatePropertyStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json({ message: `Property status updated to ${status}`, property: updated });
  }),

  requestPropertyDeletion: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Deletion reason is required' });
    }

    const existingProperty = await PropertyModel.findByIdOrSlug(id);
    if (!existingProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (existingProperty.landlord_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You can only request deletion of your own properties' });
    }

    const updated = await PropertyModel.requestDeletion(id, reason);
    if (!updated) {
      return res.status(400).json({ error: 'Property not found or is currently occupied.' });
    }
    
    res.json({ message: 'Property deletion requested. Pending admin approval.', property: updated });
  }),

  requestPropertySuspension: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Suspension reason is required' });
    }

    const existingProperty = await PropertyModel.findByIdOrSlug(id);
    if (!existingProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }
    if (existingProperty.landlord_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You can only request suspension of your own properties' });
    }

    const updated = await PropertyModel.requestSuspension(id, reason);
    if (!updated) {
      return res.status(400).json({ error: 'Property not found or is currently occupied.' });
    }

    res.json({ message: 'Property suspension requested. Pending admin approval.', property: updated });
  }),

  approvePropertyDeletion: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await PropertyModel.approveDeletion(id);
    res.json({ message: 'Property deletion approved and removed successfully.', result });
  }),

  rejectPropertyDeletion: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await PropertyModel.rejectDeletion(id);
    res.json({ message: 'Property deletion request rejected.', property: updated });
  }),

  approvePropertySuspension: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await PropertyModel.approveSuspension(id);
    res.json({ message: 'Property suspension approved.', property: updated });
  }),

  rejectPropertySuspension: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await PropertyModel.rejectSuspension(id);
    res.json({ message: 'Property suspension request rejected.', property: updated });
  }),

  getPendingRequests: asyncHandler(async (req, res) => {
    const requests = await PropertyModel.getPendingRequests();
    res.json({ requests });
  })
};
