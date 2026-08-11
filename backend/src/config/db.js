import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:lodale@localhost:5432/lodale_db',
});

// Initialize database pool and seed data if empty
export async function initDb() {
  try {
    const client = await pool.connect();
    console.log('[PostgreSQL] Connected to local PostgreSQL database: lodale_db');

    // Initialize Schema
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await client.query(schemaSql);
      console.log('[PostgreSQL] Schema synchronized.');
    } catch (err) {
      console.error('[PostgreSQL] Error running schema.sql:', err.message);
    }

    // Seed default properties if table is empty
    const res = await client.query('SELECT COUNT(*) FROM properties');
    const count = parseInt(res.rows[0].count, 10);

    if (count === 0) {
      console.log('[PostgreSQL] Seeding initial properties into PostgreSQL...');

      // First create a default landlord user for FK constraint
      const landlordId = '11111111-1111-1111-1111-111111111111';
      await client.query(`
        INSERT INTO users (id, first_name, last_name, email, primary_role)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [landlordId, 'Lodale', 'Landlord', 'landlord@lodale.com', 'landlord']);

      const initialProps = [
        {
          id: '22222222-2222-2222-2222-222222222221',
          title: 'Skyline Apartments, Block 4',
          slug: 'skyline-apartments-block-4',
          description: 'Modern luxury 3-bedroom apartment with panoramic skyline views, 24/7 power, and high-speed internet in Lekki Phase 1.',
          property_type: 'apartment',
          address_line1: 'Admiralty Way, Lekki Phase 1',
          city: 'Lagos',
          state: 'Lagos',
          bedrooms: 3,
          bathrooms: 3,
          rent_amount: 4500000,
          rent_period: 'annually',
          status: 'active_vacant',
          amenities: ['24/7 Electricity', 'Swimming Pool', 'Gym', 'Security', 'Prepaid Meter']
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          title: 'Pines Villa Executive Suite',
          slug: 'pines-villa-executive-suite',
          description: 'Spacious 4-bedroom detached villa with private garden, smart security, and fitted kitchen in Victoria Island.',
          property_type: 'detached',
          address_line1: 'Ahmadu Bello Way, Victoria Island',
          city: 'Lagos',
          state: 'Lagos',
          bedrooms: 4,
          bathrooms: 4,
          rent_amount: 8000000,
          rent_period: 'annually',
          status: 'active_vacant',
          amenities: ['Private Garden', 'Smart Security', 'Borehole Water', 'Spacious Parking']
        },
        {
          id: '22222222-2222-2222-2222-222222222223',
          title: 'Maitama Luxury Heights',
          slug: 'maitama-luxury-heights',
          description: 'Premium 2-bedroom serviced apartment located in serene Maitama neighborhood with high-grade finishes.',
          property_type: 'apartment',
          address_line1: 'Gana Street, Maitama',
          city: 'Abuja',
          state: 'FCT',
          bedrooms: 2,
          bathrooms: 2,
          rent_amount: 6000000,
          rent_period: 'annually',
          status: 'active_vacant',
          amenities: ['24/7 Electricity', 'Elevator', 'Security', 'Fitted Kitchen']
        }
      ];

      for (const p of initialProps) {
        await client.query(`
          INSERT INTO properties (id, landlord_id, title, slug, description, property_type, address_line1, city, state, bedrooms, bathrooms, rent_amount, rent_period, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO NOTHING
        `, [p.id, landlordId, p.title, p.slug, p.description, p.property_type, p.address_line1, p.city, p.state, p.bedrooms, p.bathrooms, p.rent_amount, p.rent_period, p.status]);

        for (const amenity of p.amenities) {
          await client.query(`
            INSERT INTO property_amenities (property_id, amenity)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [p.id, amenity]);
        }
      }

      console.log('[PostgreSQL] Seeding complete!');
    }

    await client.query(`
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownership_doc TEXT;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownership_doc_url TEXT;
      ALTER TABLE properties ALTER COLUMN property_type TYPE TEXT USING property_type::text;
    `);

    client.release();
  } catch (error) {
    console.error('[PostgreSQL Connection Error]:', error.message);
  }
}
