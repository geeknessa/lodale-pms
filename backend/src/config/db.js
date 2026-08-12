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

async function ensureDatabaseExists() {
  const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:lodale@localhost:5432/lodale_db';
  try {
    const parsed = new URL(dbUrl);
    const dbName = parsed.pathname.substring(1);
    if (!dbName) return;

    const systemUrl = `${parsed.protocol}//${parsed.username}${parsed.password ? ':' + parsed.password : ''}@${parsed.hostname}${parsed.port ? ':' + parsed.port : ''}/postgres`;
    const systemClient = new pg.Client({ connectionString: systemUrl });
    await systemClient.connect();
    const checkRes = await systemClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (checkRes.rowCount === 0) {
      console.log(`[PostgreSQL] Database "${dbName}" does not exist. Creating...`);
      const safeDbName = dbName.replace(/"/g, '""');
      await systemClient.query(`CREATE DATABASE "${safeDbName}"`);
      console.log(`[PostgreSQL] Database "${dbName}" created successfully.`);
    }
    await systemClient.end();
  } catch (err) {
    console.warn('[PostgreSQL] Database auto-creation check warning:', err.message);
  }
}

// Initialize database pool and seed data if empty
export async function initDb() {
  await ensureDatabaseExists();
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



    await client.query(`
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownership_doc TEXT;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS ownership_doc_url TEXT;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS rules TEXT;
      ALTER TABLE properties ADD COLUMN IF NOT EXISTS images TEXT;
      ALTER TABLE properties ALTER COLUMN property_type TYPE TEXT USING property_type::text;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `);

    // Ensure listing_approval_queue table exists for admin workflow
    await client.query(`
      CREATE TABLE IF NOT EXISTS listing_approval_queue (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
        queue_status VARCHAR(50) DEFAULT 'queued',
        rejection_reason TEXT,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP WITH TIME ZONE
      );
    `);

    client.release();
  } catch (error) {
    console.error('[PostgreSQL Connection Error]:', error.message);
  }
}
