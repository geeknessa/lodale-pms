import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/server.js';
import { pool } from '../src/config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'lodale_secret_key_2026';

describe('Admin API Endpoints', () => {
  let adminToken;
  let testUserId;
  let testPropertyId;

  beforeAll(async () => {
    // Generate admin token
    adminToken = jwt.sign(
      { id: 'constant_admin_id', email: 'admin@lodale.com', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create a temporary test user in DB
    const userRes = await pool.query(`
      INSERT INTO users (first_name, last_name, email, password_hash, primary_role)
      VALUES ('TestDelete', 'User', 'delete.test@lodale.com', 'hash', 'tenant')
      RETURNING id
    `);
    testUserId = userRes.rows[0].id;

    // Create a temporary test property in DB
    const propRes = await pool.query(`
      INSERT INTO properties (landlord_id, title, slug, description, property_type, address_line1, city, state, rent_amount, status)
      VALUES ($1, 'Test Admin Property', 'test-admin-prop', 'Desc', 'apartment', '123 Test St', 'Lagos', 'Lagos', 1500000, 'pending_review')
      RETURNING id
    `, [testUserId]);
    testPropertyId = propRes.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup if any test record left
    if (testPropertyId) {
      await pool.query('DELETE FROM properties WHERE id = $1', [testPropertyId]);
    }
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  it('GET /api/admin/users should return database users with correct roles', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    
    const testUser = res.body.find(u => u.id === testUserId);
    expect(testUser).toBeDefined();
    expect(testUser.role).toBe('Tenant');
  });

  it('POST /api/admin/properties/:id/review should approve property listing', async () => {
    const res = await request(app)
      .post(`/api/admin/properties/${testPropertyId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('active_vacant');

    // Verify status in DB
    const dbCheck = await pool.query('SELECT status FROM properties WHERE id = $1', [testPropertyId]);
    expect(dbCheck.rows[0].status).toBe('active_vacant');
  });

  it('DELETE /api/admin/users/:id should delete user from database', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');

    // Verify user is gone from DB
    const dbCheck = await pool.query('SELECT * FROM users WHERE id = $1', [testUserId]);
    expect(dbCheck.rows.length).toBe(0);
    testUserId = null; // prevent double cleanup
  });
});
