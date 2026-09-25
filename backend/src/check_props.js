import { pool } from './db/db.js';

async function checkProps() {
  try {
    const res = await pool.query("SELECT id, title, status, landlord_id, created_at, is_occupied, is_deleted FROM properties ORDER BY created_at DESC");
    console.log("=== ALL PROPERTIES IN DB ===");
    console.table(res.rows);

    const queueRes = await pool.query("SELECT * FROM listing_approval_queue ORDER BY submitted_at DESC");
    console.log("=== LISTING APPROVAL QUEUE ===");
    console.table(queueRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkProps();
