import request from 'supertest';
import app from '../src/server.js';
import { pool } from '../src/db/db.js';

describe('Health Check API', () => {
  afterAll(async () => {
    // Close the DB pool after tests to avoid open handles
    await pool.end();
  });

  it('should return 200 and a status of online', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'online');
    expect(res.body).toHaveProperty('service', 'Lodale PMS Express Backend');
  });
});
