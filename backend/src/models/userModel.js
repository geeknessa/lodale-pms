import { pool } from '../config/db.js';

export const UserModel = {
  async findByEmail(email) {
    const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rows[0] || null;
  },

  async findById(id) {
    const res = await pool.query(
      'SELECT id, first_name, last_name, email, phone_number, primary_role, id_verification_status, created_at FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  async create(userData) {
    const { firstName, lastName, email, hashedPassword, phone, role } = userData;
    const res = await pool.query(`
      INSERT INTO users (first_name, last_name, email, password_hash, phone_number, primary_role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, first_name, last_name, email, phone_number, primary_role, created_at
    `, [firstName, lastName, email, hashedPassword, phone, role]);
    return res.rows[0];
  }
};
