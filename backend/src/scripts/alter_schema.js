import { pool } from '../db/db.js';

async function alterTable() {
  try {
    console.log("Adding new columns to tenant_profiles...");
    await pool.query(`
      ALTER TABLE tenant_profiles
      ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS location VARCHAR(255),
      ADD COLUMN IF NOT EXISTS postal_code VARCHAR(50);
    `);
    console.log("Successfully altered tenant_profiles table.");
  } catch (err) {
    console.error("Error altering table:", err);
  } finally {
    await pool.end();
  }
}

alterTable();
