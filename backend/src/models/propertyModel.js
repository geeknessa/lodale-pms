import { pool } from '../config/db.js';

export const PropertyModel = {
  async getProperties(queryParams) {
    const { city, search, propertyType } = queryParams;

    let query = 'SELECT * FROM properties WHERE status::text = $1';
    const params = ['active_vacant'];

    if (city) {
      params.push(`%${city.toLowerCase()}%`);
      query += ` AND LOWER(city) LIKE $${params.length}`;
    }

    if (propertyType) {
      params.push(propertyType);
      query += ` AND property_type::text = $${params.length}`;
    }

    if (search) {
      const term = `%${search.toLowerCase()}%`;
      params.push(term);
      const idx = params.length;
      query += ` AND (LOWER(title) LIKE $${idx} OR LOWER(address_line1) LIKE $${idx} OR LOWER(city) LIKE $${idx})`;
    }

    query += ' ORDER BY created_at DESC';

    const propRes = await pool.query(query, params);
    return propRes.rows;
  },

  async getPropertiesByLandlord(landlordId) {
    const res = await pool.query(
      'SELECT * FROM properties WHERE landlord_id::text = $1 ORDER BY created_at DESC',
      [landlordId]
    );
    return res.rows;
  },

  async findByIdOrSlug(idOrSlug) {
    const res = await pool.query('SELECT * FROM properties WHERE id::text = $1 OR slug = $1', [idOrSlug]);
    return res.rows[0] || null;
  },

  async getAmenities(propertyId) {
    const res = await pool.query('SELECT amenity FROM property_amenities WHERE property_id = $1', [propertyId]);
    return res.rows.map(a => a.amenity);
  },

  async getCoverImage(propertyId) {
    // Only querying property_images if it exists, otherwise returning default in controller
    try {
      const res = await pool.query('SELECT storage_url FROM property_images WHERE property_id = $1 AND is_cover = TRUE LIMIT 1', [propertyId]);
      return res.rows[0]?.storage_url || null;
    } catch (e) {
      // Table might not exist yet
      return null; 
    }
  },

  async createProperty(data) {
    const { 
      effectiveLandlordId, title, slug, description, sanitizedPropertyType, 
      address_line1, city, state, bedrooms, bathrooms, rent_amount, status, 
      ownership_doc, ownership_doc_url, rules, images, cover_image
    } = data;

    // We removed ::property_status cast to prevent errors if the enum isn't fully defined yet in schema,
    // or we can cast it if the enum exists. Since it's a varchar in our schema, we just insert it.
    const insertRes = await pool.query(`
      INSERT INTO properties (landlord_id, title, slug, description, property_type, address_line1, city, state, bedrooms, bathrooms, rent_amount, status, ownership_doc, ownership_doc_url, rules, images, cover_image)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      effectiveLandlordId, title, slug, description || '',
      sanitizedPropertyType, address_line1, city || 'Lagos', state || 'Lagos',
      Number(bedrooms) || 1, Number(bathrooms) || 1, Number(rent_amount), status || 'pending_review',
      ownership_doc || null, ownership_doc_url || null, rules || null,
      images ? JSON.stringify(images) : '[]', cover_image || null
    ]);

    return insertRes.rows[0];
  },

  async addAmenity(propertyId, amenity) {
    await pool.query('INSERT INTO property_amenities (property_id, amenity) VALUES ($1, $2)', [propertyId, amenity]);
  },
  
  async queueForApproval(propertyId, landlordId) {
    try {
      await pool.query(`
        INSERT INTO listing_approval_queue (property_id, submitted_by, queue_status)
        VALUES ($1, $2, 'queued')
      `, [propertyId, landlordId]);
    } catch(e) {
      console.warn('listing_approval_queue table might not exist yet.');
    }
  },

  async getRejectionReason(propertyId) {
    try {
      const res = await pool.query('SELECT rejection_reason FROM listing_approval_queue WHERE property_id = $1 ORDER BY submitted_at DESC LIMIT 1', [propertyId]);
      return res.rows[0]?.rejection_reason || null;
    } catch (e) {
      return null;
    }
  },

  async updateProperty(id, data) {
    const { 
      title, description, rent_amount, beds, baths, 
      address_line1, city, state, property_type, cover_image, rules, images, amenities
    } = data;
    
    // Convert undefined to null for COALESCE to work properly
    // Convert empty strings to null for numeric fields to prevent PostgreSQL syntax errors
    const safeRent = (rent_amount !== undefined && rent_amount !== "") ? Number(rent_amount) : null;
    const safeBeds = (beds !== undefined && beds !== "") ? Number(beds) : null;
    const safeBaths = (baths !== undefined && baths !== "") ? Number(baths) : null;

    const res = await pool.query(`
      UPDATE properties 
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        rent_amount = COALESCE($3, rent_amount),
        bedrooms = COALESCE($4, bedrooms),
        bathrooms = COALESCE($5, bathrooms),
        address_line1 = COALESCE($6, address_line1),
        city = COALESCE($7, city),
        state = COALESCE($8, state),
        property_type = COALESCE($9, property_type),
        cover_image = COALESCE($10, cover_image),
        rules = COALESCE($11, rules),
        images = COALESCE($12, images),
        updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `, [
      title || null, 
      description || null, 
      safeRent, 
      safeBeds, 
      safeBaths, 
      address_line1 || null, 
      city || null, 
      state || null, 
      property_type || null, 
      cover_image || null, 
      rules || null,
      images ? JSON.stringify(images) : null,
      id
    ]);
    
    // Update Amenities
    if (amenities && Array.isArray(amenities)) {
      await pool.query('DELETE FROM property_amenities WHERE property_id = $1', [id]);
      for (const amenity of amenities) {
        if (amenity && amenity.trim()) {
          await pool.query('INSERT INTO property_amenities (property_id, amenity) VALUES ($1, $2)', [id, amenity.trim()]);
        }
      }
    }
    
    return res.rows[0];
  },

  async deleteProperty(id) {
    await pool.query('DELETE FROM properties WHERE id = $1', [id]);
  }
};
