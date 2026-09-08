import bcrypt from 'bcryptjs';
import { UserModel } from '../models/userModel.js';
import { pool } from '../db/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const emailVerificationCodes = new Map();

export const userController = {
  getMe: asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  }),

  updateMe: asyncHandler(async (req, res) => {
    const { first_name, last_name, phone_number, avatar_url } = req.body;
    const updatedUser = await UserModel.updateProfile(req.user.id, {
      first_name,
      last_name,
      phone_number,
      avatar_url
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(updatedUser);
  }),

  getLandlordTenants: asyncHandler(async (req, res) => {
    const landlordId = req.user.id;

    // 1. Fetch leases for landlord properties
    const leasesRes = await pool.query(
      `SELECT l.id as lease_id, l.status as lease_status, l.tenant_signed_at, l.landlord_signed_at,
              l.rent_amount, l.rent_period, l.start_date,
              p.id as property_id, p.title as property_title,
              u.id as tenant_id, u.first_name, u.last_name, u.email as tenant_email, u.phone_number as tenant_phone, u.avatar_url
       FROM leases l
       JOIN properties p ON l.property_id = p.id
       JOIN users u ON l.tenant_id = u.id
       WHERE l.landlord_id = $1
       ORDER BY l.created_at DESC`,
      [landlordId]
    );

    // 2. Fetch applications for landlord properties
    const appsRes = await pool.query(
      `SELECT a.id as application_id, a.status as application_status, a.created_at,
              p.id as property_id, p.title as property_title, p.rent_amount, p.rent_period,
              u.id as tenant_id, u.first_name, u.last_name, u.email as tenant_email, u.phone_number as tenant_phone, u.avatar_url
       FROM property_applications a
       JOIN properties p ON a.property_id = p.id
       JOIN users u ON a.tenant_id = u.id
       WHERE p.landlord_id = $1
       ORDER BY a.created_at DESC`,
      [landlordId]
    );

    const tenants = [];
    const seenTenantKeys = new Set();

    // Map leases
    leasesRes.rows.forEach(l => {
      const isSigned = !!l.tenant_signed_at || l.lease_status === 'signed' || l.lease_status === 'active';
      const isActive = l.lease_status === 'active';
      const isPending = !isActive;

      let status = 'past';
      if (isActive) status = 'active';
      else if (isPending) status = 'pending';

      let badgeLabel = 'Active Tenant';
      if (!isActive) {
        if (!isSigned) badgeLabel = 'Pending Signature';
        else badgeLabel = 'Pending Sign & Pay';
      }

      const key = String(l.tenant_id || l.tenant_email).toLowerCase();
      seenTenantKeys.add(key);

      tenants.push({
        id: l.tenant_id || l.lease_id,
        name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Tenant',
        email: l.tenant_email || '',
        phone: l.tenant_phone || '',
        avatar: l.avatar_url || '',
        propertyId: l.property_id,
        propertyTitle: l.property_title || 'Leased Property',
        status: status,
        leaseStatus: badgeLabel,
        rentAmount: l.rent_amount,
        dueDate: l.start_date ? new Date(l.start_date).toLocaleDateString("en-US", { day: 'numeric', month: 'short' }) : "1st of month",
        paymentStatus: isActive ? "Paid" : "Unpaid"
      });
    });

    // Map applications - ONLY include if a lease agreement has been generated/sent or fully leased!
    appsRes.rows.forEach(a => {
      const key = String(a.tenant_id || a.tenant_email).toLowerCase();
      if (!seenTenantKeys.has(key)) {
        const s = (a.application_status || '').toLowerCase();
        const isFullyLeased = s === 'leased' || s === 'active';
        const isLeaseSent = s === 'approved' || s === 'lease_generated' || s === 'pending_tenant' || s === 'signed';

        // Strictly skip raw applicants who have not been sent a lease agreement yet
        if (!isFullyLeased && !isLeaseSent) return;

        seenTenantKeys.add(key);

        let status = isFullyLeased ? 'active' : 'pending';
        let badgeLabel = isFullyLeased ? 'Active Tenant' : 'Pending Sign & Pay';

        tenants.push({
          id: a.tenant_id || a.application_id,
          name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Tenant',
          email: a.tenant_email || '',
          phone: a.tenant_phone || '',
          avatar: a.avatar_url || '',
          propertyId: a.property_id,
          propertyTitle: a.property_title || 'Leased Property',
          status: status,
          leaseStatus: badgeLabel,
          rentAmount: a.rent_amount || 0,
          dueDate: "1st of month",
          paymentStatus: isFullyLeased ? "Paid" : "Unpaid"
        });
      }
    });

    res.json({ success: true, tenants });
  }),

  deactivateMyAccount: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { reason } = req.body;

    // Check if user has active leases as tenant
    const activeLease = await pool.query(
      `SELECT id FROM leases WHERE tenant_id = $1 AND status::text IN ('active', 'leased', 'signed') LIMIT 1`,
      [userId]
    );
    if (activeLease.rows.length > 0) {
      return res.status(400).json({
        error: "Account closure blocked: You currently hold an active tenancy lease. You cannot delete or deactivate your account while a lease is active."
      });
    }

    // Check if user has pending applications as tenant
    const pendingApp = await pool.query(
      `SELECT id FROM property_applications WHERE tenant_id = $1 AND status::text IN ('pending', 'under_review', 'lease_generated') LIMIT 1`,
      [userId]
    );
    if (pendingApp.rows.length > 0) {
      return res.status(400).json({
        error: "Account closure blocked: You have pending property applications. Please withdraw your applications before closing your account."
      });
    }

    // Check if user is landlord with active occupied properties
    const occupiedProp = await pool.query(
      `SELECT id FROM properties WHERE landlord_id = $1 AND is_occupied = TRUE LIMIT 1`,
      [userId]
    );
    if (occupiedProp.rows.length > 0) {
      return res.status(400).json({
        error: "Account closure blocked: You have properties with active tenants. You cannot deactivate your account while tenants occupy your property."
      });
    }

    const softDeleted = await UserModel.softDeleteUser(userId, reason || 'Self-service account deletion request');
    if (!softDeleted) {
      return res.status(404).json({ error: 'User account not found' });
    }

    res.json({
      success: true,
      message: 'Your account has been deactivated/closed. If you ever wish to restore your account, contact Admin.',
      user: softDeleted
    });
  }),

  payRestorationFee: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { paymentReference } = req.body;

    const restored = await UserModel.payRestorationFee(userId, paymentReference || 'PAY-FEE-' + Date.now());
    if (!restored) {
      return res.status(404).json({ error: 'User account not found' });
    }

    res.json({
      success: true,
      message: 'Restoration fee paid successfully! Your account is now fully active.',
      user: restored
    });
  }),

  changePassword: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const userWithHash = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const hash = userWithHash.rows[0]?.password_hash;
    if (!hash) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await UserModel.updatePassword(userId, newHash);

    res.json({ success: true, message: 'Password updated successfully!' });
  }),

  requestEmailChange: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { newEmail } = req.body;
    if (!newEmail || !newEmail.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid new email address.' });
    }

    const existing = await UserModel.findByEmail(newEmail);
    if (existing && existing.id !== userId) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    emailVerificationCodes.set(userId, { newEmail: newEmail.toLowerCase(), code, expiresAt: Date.now() + 10 * 60 * 1000 });

    res.json({
      success: true,
      message: `Verification code sent to ${newEmail}`,
      demoCode: code
    });
  }),

  verifyEmailChange: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { newEmail, code } = req.body;

    const record = emailVerificationCodes.get(userId);
    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Verification code has expired or was not requested. Please request a new code.' });
    }

    if (record.code !== String(code).trim() || record.newEmail !== String(newEmail).trim().toLowerCase()) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    const updatedUser = await UserModel.updateEmail(userId, record.newEmail);
    emailVerificationCodes.delete(userId);

    res.json({
      success: true,
      message: 'Email address updated successfully!',
      user: updatedUser
    });
  })
};
