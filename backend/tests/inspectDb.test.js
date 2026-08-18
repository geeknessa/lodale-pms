import { pool } from '../src/config/db.js';

describe('Inspect DB Properties', () => {
  it('should query all property records in properties table', async () => {
    const res = await pool.query('SELECT id, title, status, landlord_id, created_at FROM properties ORDER BY created_at DESC');
    console.log('=== CURRENT DB PROPERTIES COUNT ===:', res.rows.length);
    console.log('=== CURRENT DB PROPERTIES ===:', JSON.stringify(res.rows, null, 2));
    expect(res).toBeDefined();
  });

  afterAll(async () => {
    await pool.end();
  });
});
