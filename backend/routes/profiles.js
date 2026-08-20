import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'lodale_secret_key_2026';

/**
 * Middleware: Extract and verify JWT user session
 */
const authenticateSession = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized session.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/* ============================================================================
   1. TENANT PROFILE ENDPOINTS
============================================================================ */

/**
 * GET /api/tenant/profile
 * Retrieves tenant-scoped profile details
 */
router.get('/tenant/profile', authenticateSession, async (req, res) => {
  try {
    const userId = req.user.id;
    let profileRes = await pool.query('SELECT * FROM tenant_profiles WHERE user_id = $1', [userId]);

    if (profileRes.rows.length === 0) {
      // Lazy initialize profile from users base table if first time access
      const userRes = await pool.query('SELECT first_name, last_name, phone_number, avatar_url, bio FROM users WHERE id = $1', [userId]);
      const u = userRes.rows[0] || {};
      profileRes = await pool.query(`
        INSERT INTO tenant_profiles (user_id, first_name, last_name, phone_number, avatar_url, bio)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [userId, u.first_name || '', u.last_name || '', u.phone_number || '', u.avatar_url || '', u.bio || '']);
    }

    res.json({ profile: profileRes.rows[0] });
  } catch (error) {
    console.error('[Tenant Profile Fetch Error]:', error);
    res.status(500).json({ error: 'Failed to fetch tenant profile.' });
  }
});

/**
 * PUT /api/tenant/profile
 * Mutates ONLY the tenant_profiles table for the active session
 */
router.put('/tenant/profile', authenticateSession, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName, lastName, phone, address, dob, location, postalCode,
      avatarUrl, bio, emergencyContactName, emergencyContactPhone
    } = req.body;

    const upsertRes = await pool.query(`
      INSERT INTO tenant_profiles (
        user_id, first_name, last_name, phone_number, address, dob, location, postal_code,
        avatar_url, bio, emergency_contact_name, emergency_contact_phone, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone_number = EXCLUDED.phone_number,
        address = EXCLUDED.address,
        dob = EXCLUDED.dob,
        location = EXCLUDED.location,
        postal_code = EXCLUDED.postal_code,
        avatar_url = EXCLUDED.avatar_url,
        bio = EXCLUDED.bio,
        emergency_contact_name = EXCLUDED.emergency_contact_name,
        emergency_contact_phone = EXCLUDED.emergency_contact_phone,
        updated_at = NOW()
      RETURNING *
    `, [
      userId, firstName || '', lastName || '', phone || '', address || '',
      dob || null, location || '', postalCode || '', avatarUrl || '', bio || '',
      emergencyContactName || '', emergencyContactPhone || ''
    ]);

    res.json({ message: 'Tenant profile updated successfully', profile: upsertRes.rows[0] });
  } catch (error) {
    console.error('[Tenant Profile Update Error]:', error);
    res.status(500).json({ error: 'Failed to update tenant profile.' });
  }
});

/* ============================================================================
   2. LANDLORD PROFILE ENDPOINTS
============================================================================ */

/**
 * GET /api/landlord/profile
 * Retrieves landlord-scoped profile details
 */
router.get('/landlord/profile', authenticateSession, async (req, res) => {
  try {
    const userId = req.user.id;
    let profileRes = await pool.query('SELECT * FROM landlord_profiles WHERE user_id = $1', [userId]);

    if (profileRes.rows.length === 0) {
      const userRes = await pool.query('SELECT first_name, last_name, phone_number, avatar_url, bio FROM users WHERE id = $1', [userId]);
      const u = userRes.rows[0] || {};
      profileRes = await pool.query(`
        INSERT INTO landlord_profiles (user_id, first_name, last_name, phone_number, avatar_url, bio)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [userId, u.first_name || '', u.last_name || '', u.phone_number || '', u.avatar_url || '', u.bio || '']);
    }

    res.json({ profile: profileRes.rows[0] });
  } catch (error) {
    console.error('[Landlord Profile Fetch Error]:', error);
    res.status(500).json({ error: 'Failed to fetch landlord profile.' });
  }
});

/**
 * PUT /api/landlord/profile
 * Mutates ONLY the landlord_profiles table for the active session
 */
router.put('/landlord/profile', authenticateSession, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName, lastName, phone, address, dob, location, postalCode,
      avatarUrl, bio, companyName, taxId, bankName, bankAccountName, bankAccountNumber
    } = req.body;

    const upsertRes = await pool.query(`
      INSERT INTO landlord_profiles (
        user_id, first_name, last_name, phone_number, address, dob, location, postal_code,
        avatar_url, bio, company_name, tax_identification_no, bank_name, bank_account_name, bank_account_number, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone_number = EXCLUDED.phone_number,
        address = EXCLUDED.address,
        dob = EXCLUDED.dob,
        location = EXCLUDED.location,
        postal_code = EXCLUDED.postal_code,
        avatar_url = EXCLUDED.avatar_url,
        bio = EXCLUDED.bio,
        company_name = EXCLUDED.company_name,
        tax_identification_no = EXCLUDED.tax_identification_no,
        bank_name = EXCLUDED.bank_name,
        bank_account_name = EXCLUDED.bank_account_name,
        bank_account_number = EXCLUDED.bank_account_number,
        updated_at = NOW()
      RETURNING *
    `, [
      userId, firstName || '', lastName || '', phone || '', address || '',
      dob || null, location || '', postalCode || '', avatarUrl || '', bio || '',
      companyName || '', taxId || '', bankName || '', bankAccountName || '', bankAccountNumber || ''
    ]);

    res.json({ message: 'Landlord profile updated successfully', profile: upsertRes.rows[0] });
  } catch (error) {
    console.error('[Landlord Profile Update Error]:', error);
    res.status(500).json({ error: 'Failed to update landlord profile.' });
  }
});

/* ============================================================================
   3. ADMIN PROFILE ENDPOINTS
============================================================================ */

/**
 * GET /api/admin/profile
 * Retrieves admin-scoped profile details
 */
router.get('/admin/profile', authenticateSession, async (req, res) => {
  try {
    const userId = req.user.id;
    let profileRes = await pool.query('SELECT * FROM admin_profiles WHERE user_id = $1', [userId]);

    if (profileRes.rows.length === 0) {
      const userRes = await pool.query('SELECT first_name, last_name, phone_number, avatar_url FROM users WHERE id = $1', [userId]);
      const u = userRes.rows[0] || {};
      const displayName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'System Admin';
      profileRes = await pool.query(`
        INSERT INTO admin_profiles (user_id, display_name, phone_number, avatar_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [userId, displayName, u.phone_number || '', u.avatar_url || '']);
    }

    res.json({ profile: profileRes.rows[0] });
  } catch (error) {
    console.error('[Admin Profile Fetch Error]:', error);
    res.status(500).json({ error: 'Failed to fetch admin profile.' });
  }
});

/**
 * PUT /api/admin/profile
 * Mutates ONLY the admin_profiles table for the active session
 */
router.put('/admin/profile', authenticateSession, async (req, res) => {
  try {
    const userId = req.user.id;
    const { displayName, username, phone, avatarUrl, department } = req.body;

    const upsertRes = await pool.query(`
      INSERT INTO admin_profiles (
        user_id, display_name, username, phone_number, avatar_url, department, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        username = EXCLUDED.username,
        phone_number = EXCLUDED.phone_number,
        avatar_url = EXCLUDED.avatar_url,
        department = EXCLUDED.department,
        updated_at = NOW()
      RETURNING *
    `, [
      userId, displayName || 'System Admin', username || 'admin',
      phone || '', avatarUrl || '', department || 'Operations'
    ]);

    res.json({ message: 'Admin profile updated successfully', profile: upsertRes.rows[0] });
  } catch (error) {
    console.error('[Admin Profile Update Error]:', error);
    res.status(500).json({ error: 'Failed to update admin profile.' });
  }
});

export default router;
