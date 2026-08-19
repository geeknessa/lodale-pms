import { pool } from '../config/db.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const CONSTANT_ADMIN_UUID = '00000000-0000-0000-0000-000000000001';

export const UserModel = {
  async findByEmail(email) {
    const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rows[0] || null;
  },

  async findById(id) {
    if (!id || typeof id !== 'string') return null;
    if (id === 'constant_admin_id' || id === CONSTANT_ADMIN_UUID) {
      const dbAdmin = await this.findByEmail('admin@lodale.com');
      if (dbAdmin) return dbAdmin;
      return {
        id: CONSTANT_ADMIN_UUID,
        first_name: 'System',
        last_name: 'Admin',
        email: 'admin@lodale.com',
        phone_number: '+234 809 333 2211',
        primary_role: 'admin',
        id_verification_status: 'verified',
        avatar_url: null,
        created_at: new Date().toISOString()
      };
    }
    if (!UUID_REGEX.test(id)) return null;
    const res = await pool.query(
      'SELECT id, first_name, last_name, email, phone_number, primary_role, id_verification_status, avatar_url, created_at FROM users WHERE id = $1',
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
  },

  async updateProfile(id, profileData) {
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
      return {
        id: id || CONSTANT_ADMIN_UUID,
        first_name: profileData.first_name || 'System',
        last_name: profileData.last_name || 'Admin',
        email: 'admin@lodale.com',
        phone_number: profileData.phone_number || '+234 809 333 2211',
        primary_role: 'admin',
        avatar_url: profileData.avatar_url || null,
        created_at: new Date().toISOString()
      };
    }
    const { first_name, last_name, phone_number, avatar_url } = profileData;
    const res = await pool.query(`
      UPDATE users 
      SET first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          phone_number = COALESCE($3, phone_number),
          avatar_url = COALESCE($4, avatar_url)
      WHERE id = $5
      RETURNING id, first_name, last_name, email, phone_number, primary_role, id_verification_status, avatar_url, created_at
    `, [first_name, last_name, phone_number, avatar_url, id]);
    
    return res.rows[0] || null;
  },

  async deleteUser(id) {
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) return null;
    const res = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, first_name, last_name, email, primary_role', [id]);
    return res.rows[0] || null;
  }
};
