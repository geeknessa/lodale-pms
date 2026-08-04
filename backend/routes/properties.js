import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

/**
 * GET /api/properties
 * Public tenant search: returns only active_vacant listings
 */
router.get('/', async (req, res) => {
  try {
    const { city, search, propertyType } = req.query;

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
    const properties = propRes.rows;

    const formatted = await Promise.all(properties.map(async p => {
      const amenitiesRes = await pool.query('SELECT amenity FROM property_amenities WHERE property_id = $1', [p.id]);
      const imgRes = await pool.query('SELECT storage_url FROM property_images WHERE property_id = $1 AND is_cover = TRUE LIMIT 1', [p.id]);

      return {
        ...p,
        amenities: amenitiesRes.rows.map(a => a.amenity),
        cover_image: imgRes.rows[0]?.storage_url || '/src/assets/skyline_apartment.png',
        price: `₦${Number(p.rent_amount).toLocaleString()}/yr`,
        location: `${p.address_line1}, ${p.city}`,
      };
    }));

    res.json(formatted);
  } catch (error) {
    console.error('[Properties Route Error]:', error);
    res.status(500).json({ error: 'Failed to fetch properties.' });
  }
});

/**
 * GET /api/properties/landlord/:landlordId
 * Fetch all properties owned by a specific landlord (including pending/draft/info_requested)
 */
router.get('/landlord/:landlordId', async (req, res) => {
  try {
    const { landlordId } = req.params;

    const propRes = await pool.query(
      'SELECT * FROM properties WHERE landlord_id::text = $1 ORDER BY created_at DESC',
      [landlordId]
    );

    const properties = propRes.rows;

    const formatted = await Promise.all(properties.map(async p => {
      const amenitiesRes = await pool.query('SELECT amenity FROM property_amenities WHERE property_id = $1', [p.id]);
      const queueRes = await pool.query('SELECT rejection_reason FROM listing_approval_queue WHERE property_id = $1 ORDER BY submitted_at DESC LIMIT 1', [p.id]);

      return {
        ...p,
        amenities: amenitiesRes.rows.map(a => a.amenity),
        admin_notes: queueRes.rows[0]?.rejection_reason || null,
        price: `₦${Number(p.rent_amount).toLocaleString()}/yr`,
        location: `${p.address_line1}, ${p.city}`,
      };
    }));

    res.json(formatted);
  } catch (error) {
    console.error('[Properties Route Error]:', error);
    res.status(500).json({ error: 'Failed to fetch landlord properties.' });
  }
});

/**
 * GET /api/properties/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const propRes = await pool.query('SELECT * FROM properties WHERE id::text = $1 OR slug = $1', [id]);

    if (propRes.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const property = propRes.rows[0];

    const amenitiesRes = await pool.query('SELECT amenity FROM property_amenities WHERE property_id = $1', [property.id]);
    const landlordRes = await pool.query('SELECT id, first_name, last_name, phone_number FROM users WHERE id = $1', [property.landlord_id]);

    res.json({
      ...property,
      amenities: amenitiesRes.rows.map(a => a.amenity),
      landlord: landlordRes.rows[0] || null,
      price: `₦${Number(property.rent_amount).toLocaleString()}/yr`,
      location: `${property.address_line1}, ${property.city}`,
    });
  } catch (error) {
    console.error('[Properties Route Error]:', error);
    res.status(500).json({ error: 'Failed to fetch property details.' });
  }
});

/**
 * POST /api/properties
 * Submits a new property listing with default status 'pending_review'
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, address_line1, city, state, rent_amount, bedrooms, bathrooms, property_type, amenities, landlord_id } = req.body;

    if (!title || !address_line1 || !rent_amount) {
      return res.status(400).json({ error: 'Title, address, and rent amount are required.' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const effectiveLandlordId = landlord_id || '11111111-1111-1111-1111-111111111111';

    // 1. Insert property with status = 'pending_review'
    const insertRes = await pool.query(`
      INSERT INTO properties (landlord_id, title, slug, description, property_type, address_line1, city, state, bedrooms, bathrooms, rent_amount, status)
      VALUES ($1, $2, $3, $4, $5::property_type, $6, $7, $8, $9, $10, $11, $12::property_status)
      RETURNING *
    `, [
      effectiveLandlordId, title, slug, description || '',
      property_type || 'apartment', address_line1, city || 'Lagos', state || 'Lagos',
      Number(bedrooms) || 1, Number(bathrooms) || 1, Number(rent_amount), 'pending_review'
    ]);

    const property = insertRes.rows[0];

    // 2. Insert amenities
    if (Array.isArray(amenities) && amenities.length > 0) {
      for (const amenity of amenities) {
        await pool.query('INSERT INTO property_amenities (property_id, amenity) VALUES ($1, $2)', [property.id, amenity]);
      }
    }

    // 3. Queue property in listing_approval_queue for Admin Review
    await pool.query(`
      INSERT INTO listing_approval_queue (property_id, submitted_by, queue_status)
      VALUES ($1, $2, 'queued'::listing_queue_status)
    `, [property.id, effectiveLandlordId]);

    res.status(201).json({
      ...property,
      status: 'pending_review',
      message: 'Property submitted successfully! It is now pending admin review before going live.'
    });
  } catch (error) {
    console.error('[Properties Route Error]:', error);
    res.status(500).json({ error: 'Failed to create property.' });
  }
});

export default router;
