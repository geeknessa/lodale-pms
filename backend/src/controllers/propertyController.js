import { PropertyModel } from '../models/propertyModel.js';
import { UserModel } from '../models/userModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const propertyController = {
  getProperties: asyncHandler(async (req, res) => {
    const properties = await PropertyModel.getProperties(req.query);

    const formatted = await Promise.all(properties.map(async p => {
      const amenities = await PropertyModel.getAmenities(p.id);
      const coverImage = await PropertyModel.getCoverImage(p.id);

      return {
        ...p,
        amenities,
        cover_image: coverImage || '/src/assets/skyline_apartment.png',
        price: `₦${Number(p.rent_amount).toLocaleString()}/yr`,
        location: `${p.address_line1}, ${p.city}`,
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

      return {
        ...p,
        amenities,
        admin_notes: adminNotes,
        price: `₦${Number(p.rent_amount).toLocaleString()}/yr`,
        location: `${p.address_line1}, ${p.city}`,
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
    const landlord = await UserModel.findById(property.landlord_id);
    
    let landlordResponse = null;
    if (landlord) {
       landlordResponse = {
          id: landlord.id,
          first_name: landlord.first_name,
          last_name: landlord.last_name,
          phone_number: landlord.phone_number
       };
    }

    res.json({
      ...property,
      amenities,
      landlord: landlordResponse,
      price: `₦${Number(property.rent_amount).toLocaleString()}/yr`,
      location: `${property.address_line1}, ${property.city}`,
    });
  }),

  createProperty: asyncHandler(async (req, res) => {
    const { title, description, address_line1, city, state, rent_amount, bedrooms, bathrooms, property_type, amenities, landlord_id, ownership_doc, ownership_doc_url } = req.body;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const effectiveLandlordId = landlord_id || '11111111-1111-1111-1111-111111111111';
    const sanitizedPropertyType = (property_type || 'apartment').toString().trim().toLowerCase().replace(/\s+/g, '_');

    const property = await PropertyModel.createProperty({
      effectiveLandlordId, title, slug, description, sanitizedPropertyType, 
      address_line1, city, state, bedrooms, bathrooms, rent_amount, status: 'pending_review', 
      ownership_doc, ownership_doc_url
    });

    if (Array.isArray(amenities) && amenities.length > 0) {
      for (const amenity of amenities) {
        await PropertyModel.addAmenity(property.id, amenity);
      }
    }

    await PropertyModel.queueForApproval(property.id, effectiveLandlordId);

    res.status(201).json({
      ...property,
      status: 'pending_review',
      message: 'Property submitted successfully! It is now pending admin review before going live.'
    });
  })
};
