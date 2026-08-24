import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('[FATAL] DATABASE_URL environment variable is required. Set it in backend/.env');
  process.exit(1);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper to ensure target database exists before connecting
async function ensureDatabaseExists() {
  const dbUrlStr = process.env.DATABASE_URL;
  try {
    const url = new URL(dbUrlStr);
    const dbName = url.pathname.replace(/^\//, '') || 'lodale_db';
    if (!dbName || dbName === 'postgres') return;

    url.pathname = '/postgres';
    const tempClient = new pg.Client({ connectionString: url.toString() });
    await tempClient.connect();
    
    const res = await tempClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      console.log(`[PostgreSQL] Database "${dbName}" does not exist. Creating database automatically...`);
      await tempClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[PostgreSQL] Database "${dbName}" created successfully!`);
    }
    await tempClient.end();
  } catch (err) {
    console.error('[PostgreSQL Auto-Create Warning]:', err.message);
  }
}

// Initialize database pool and seed data if empty
export async function initDb() {
  let client;
  try {
    try {
      client = await pool.connect();
    } catch (err) {
      if (err.code === '3D000' || err.message.includes('does not exist')) {
        await ensureDatabaseExists();
        client = await pool.connect();
      } else {
        throw err;
      }
    }
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



    await client.query(`
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownership_doc TEXT;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownership_doc_url TEXT;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownership_doc_type TEXT;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS rules TEXT;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS images TEXT;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);
      ALTER TABLE properties ALTER COLUMN property_type TYPE TEXT USING property_type::text;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'active';
    `);

    // Widen numeric columns to prevent overflow with large Nigerian property values
    try {
      await client.query(`
        ALTER TABLE properties ALTER COLUMN rent_amount TYPE NUMERIC(20, 2);
        ALTER TABLE property_units ALTER COLUMN rent_amount TYPE NUMERIC(20, 2);
      `);
    } catch (e) {
      // Columns may already be at correct size — safe to ignore
    }

    // Ensure listing_approval_queue table exists for admin workflow
    await client.query(`
      CREATE TABLE IF NOT EXISTS listing_approval_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
        queue_status VARCHAR(50) DEFAULT 'queued',
        rejection_reason TEXT,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS property_blocks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS property_units (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        block_id UUID REFERENCES property_blocks(id) ON DELETE SET NULL,
        unit_name VARCHAR(100) NOT NULL,
        bedrooms SMALLINT NOT NULL DEFAULT 1,
        bathrooms SMALLINT NOT NULL DEFAULT 1,
        rent_amount NUMERIC(20, 2) NOT NULL DEFAULT 0.00,
        rent_period VARCHAR(20) NOT NULL DEFAULT 'annually',
        status VARCHAR(30) NOT NULL DEFAULT 'vacant',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Avoid ON CONFLICT which fails without a unique constraint
    `);

    const adminCheck = await client.query("SELECT id FROM users WHERE email IN ('admin', 'admin@lodale.com')");
    if (adminCheck.rowCount === 0) {
      await client.query(`
        INSERT INTO users (first_name, last_name, email, password_hash, primary_role, id_verification_status, phone_number)
        VALUES 
          ('System', 'Admin', 'admin', '$2a$10$oGLTVt6pnp30pVGSiVmAmu8FgTjGo/2IYOD/gZhzhaaY/obTdBdlK', 'admin', 'verified', '+234 801 000 0000')
      `);
    }

    // --- Migration: Role-Specific Profile Tables ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS landlord_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255),
        business_type VARCHAR(100),
        tax_id VARCHAR(100),
        bank_name VARCHAR(150),
        bank_account_number VARCHAR(50),
        bank_account_name VARCHAR(150),
        total_properties_managed INTEGER DEFAULT 0,
        years_in_business INTEGER,
        professional_license VARCHAR(100),
        website_url TEXT,
        bio TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tenant_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        date_of_birth DATE,
        nationality VARCHAR(100),
        occupation VARCHAR(150),
        employer_name VARCHAR(255),
        employment_status VARCHAR(50),
        monthly_income NUMERIC(15, 2),
        marital_status VARCHAR(50),
        number_of_dependants SMALLINT DEFAULT 0,
        guarantor_name VARCHAR(255),
        guarantor_phone VARCHAR(50),
        guarantor_email VARCHAR(255),
        guarantor_relationship VARCHAR(100),
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(50),
        emergency_contact_relationship VARCHAR(100),
        preferred_move_in_date DATE,
        max_budget NUMERIC(15, 2),
        bio TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS support_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_role VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS property_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        rejection_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(property_id, tenant_id)
      );
      
      -- Ensure rejection_reason exists if table was already created
      ALTER TABLE property_applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
    `);

    client.release();
  } catch (error) {
    console.error('[PostgreSQL Connection Error]:', error.message);
  }
}

/**
 * Clears all user accounts (except system admin), property listings, units, and approval queues
 * so users can freely register fresh accounts.
 */
export async function clearDatabase() {
  const client = await pool.connect();
  try {
    console.log('[PostgreSQL] Clearing user accounts and property listings...');
    await client.query(`
      TRUNCATE listing_approval_queue, property_amenities, property_units, property_blocks, properties CASCADE;
      DELETE FROM users WHERE email != 'admin@lodale.com';
    `);
    console.log('[PostgreSQL] Database successfully cleared! Users can now register fresh accounts.');
    return { success: true, message: 'Database cleared successfully. System admin preserved.' };
  } catch (error) {
    console.error('[PostgreSQL Clear DB Error]:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

