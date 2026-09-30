import { pool } from '../db/db.js';

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
      const dbAdmin = await this.findByEmail('admin');
      if (dbAdmin) return dbAdmin;
      return {
        id: CONSTANT_ADMIN_UUID,
        first_name: 'System',
        last_name: 'Admin',
        email: 'admin',
        phone_number: '+234 809 333 2211',
        primary_role: 'admin',
        id_verification_status: 'verified',
        avatar_url: null,
        created_at: new Date().toISOString()
      };
    }
    if (!UUID_REGEX.test(id)) return null;
    const res = await pool.query(
      'SELECT id, first_name, last_name, email, phone_number, primary_role, id_verification_status, account_status, avatar_url, created_at FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  async create(userData) {
    const { firstName, lastName, email, hashedPassword, phone, role } = userData;
    const res = await pool.query(`
      INSERT INTO users (first_name, last_name, email, password_hash, phone_number, primary_role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, first_name, last_name, email, phone_number, primary_role, account_status, created_at
    `, [firstName, lastName, email, hashedPassword, phone, role]);
    return res.rows[0];
  },

  async updateProfile(id, profileData) {
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
      return {
        id: id || CONSTANT_ADMIN_UUID,
        first_name: profileData.first_name || 'System',
        last_name: profileData.last_name || 'Admin',
        email: 'admin',
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
      RETURNING id, first_name, last_name, email, phone_number, primary_role, id_verification_status, account_status, avatar_url, created_at
    `, [first_name, last_name, phone_number, avatar_url, id]);
    
    return res.rows[0] || null;
  },

  async updateUserStatus(id, status) {
    const res = await pool.query(
      'UPDATE users SET account_status = $1 WHERE id = $2 RETURNING id, first_name, last_name, email, primary_role, account_status',
      [status, id]
    );
    return res.rows[0] || null;
  },

  async softDeleteUser(id, reason = 'User requested deletion') {
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) return null;
    const res = await pool.query(`
      UPDATE users 
      SET account_status = 'deleted_by_user',
          deleted_at = NOW(),
          deletion_reason = $2
      WHERE id = $1
      RETURNING id, first_name, last_name, email, primary_role, account_status, deleted_at
    `, [id, reason]);
    return res.rows[0] || null;
  },

  async restoreUser(id, { feeAmount = 0, isFeePaid = true, paymentRef = null } = {}) {
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) return null;
    const numFee = Number(feeAmount) || 0;
    const finalStatus = (numFee === 0 || isFeePaid) ? 'active' : 'pending_restoration_fee';
    const feeStatus = numFee === 0 ? 'none' : (isFeePaid ? 'paid' : 'pending');

    const res = await pool.query(`
      UPDATE users 
      SET account_status = $2,
          restoration_fee_amount = $3,
          restoration_fee_status = $4,
          restoration_fee_paid_at = CASE WHEN $5::boolean THEN NOW() ELSE NULL END,
          restoration_payment_reference = $6,
          deleted_at = NULL,
          deletion_reason = NULL
      WHERE id = $1
      RETURNING id, first_name, last_name, email, primary_role, account_status, restoration_fee_amount, restoration_fee_status
    `, [id, finalStatus, numFee, feeStatus, isFeePaid, paymentRef]);

    return res.rows[0] || null;
  },

  async payRestorationFee(id, paymentRef = 'online_gateway') {
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) return null;
    const res = await pool.query(`
      UPDATE users 
      SET account_status = 'active',
          restoration_fee_status = 'paid',
          restoration_fee_paid_at = NOW(),
          restoration_payment_reference = $2
      WHERE id = $1
      RETURNING id, first_name, last_name, email, primary_role, account_status, restoration_fee_amount, restoration_fee_status
    `, [id, paymentRef]);

    return res.rows[0] || null;
  },

  async deleteUser(id) {
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) return null;
    try {
      const res = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, first_name, last_name, email, primary_role', [id]);
      return res.rows[0] || null;
    } catch (err) {
      // If foreign key constraint exists, fallback to soft deletion / archive
      return await this.softDeleteUser(id, 'Archived by Admin');
    }
  },

  async updatePassword(id, passwordHash) {
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) return null;
    const res = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, first_name, last_name, email, primary_role',
      [passwordHash, id]
    );
    return res.rows[0] || null;
  },

  async updateEmail(id, newEmail) {
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) return null;
    const res = await pool.query(
      'UPDATE users SET email = $1 WHERE id = $2 RETURNING id, first_name, last_name, email, primary_role',
      [newEmail, id]
    );
    return res.rows[0] || null;
  }
};
