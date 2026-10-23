import bcrypt from 'bcryptjs';
import { UserModel } from '../models/userModel.js';
import { pool } from '../db/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { invalidateUserStatusCache } from '../middlewares/authMiddleware.js';
import { isEmailEnabled, sendVerificationCodeEmail } from '../services/emailService.js';

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
    const role = req.user.role || req.user.primary_role;
    if (role !== 'landlord' && role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only landlords can view tenants list' });
    }
    const landlordId = req.user.id;

    // 1. Fetch leases for landlord properties
    const leasesRes = await pool.query(
      `SELECT l.id as lease_id, l.status as lease_status, l.tenant_signed_at, l.landlord_signed_at,
              l.rent_amount, l.rent_period, l.start_date, l.end_date, l.application_id,
              p.id as property_id, p.title as property_title, p.address_line1 as property_address,
              u.id as tenant_id, u.first_name, u.last_name, u.email as tenant_email, u.phone_number as tenant_phone, u.avatar_url,
              tp.emergency_contact_name as emergency_contact, tp.guarantor_phone, tp.occupation, tp.employment_status, tp.guarantor_name
       FROM leases l
       JOIN properties p ON l.property_id = p.id
       JOIN users u ON l.tenant_id = u.id
       LEFT JOIN tenant_profiles tp ON u.id = tp.user_id
       WHERE l.landlord_id = $1
       ORDER BY l.created_at DESC`,
      [landlordId]
    );

    // 2. Fetch applications for landlord properties
    const appsRes = await pool.query(
      `SELECT a.id as application_id, a.status as application_status, a.created_at,
              p.id as property_id, p.title as property_title, p.rent_amount, p.rent_period, p.address_line1 as property_address,
              u.id as tenant_id, u.first_name, u.last_name, u.email as tenant_email, u.phone_number as tenant_phone, u.avatar_url,
              tp.emergency_contact_name as emergency_contact, tp.guarantor_phone, tp.occupation, tp.employment_status, tp.guarantor_name
       FROM property_applications a
       JOIN properties p ON a.property_id = p.id
       JOIN users u ON a.tenant_id = u.id
       LEFT JOIN tenant_profiles tp ON u.id = tp.user_id
       WHERE p.landlord_id = $1
       ORDER BY a.created_at DESC`,
      [landlordId]
    );

    // 3. Fetch invoices for landlord properties
    const invsRes = await pool.query(
      `SELECT i.id, i.invoice_number, i.tenant_id, i.property_id, i.lease_id, i.application_id,
              i.status, i.amount, i.due_date, i.issue_date, i.items
       FROM rent_invoices i
       WHERE i.landlord_id = $1
       ORDER BY i.created_at DESC`,
      [landlordId]
    );

    const makeTenancyKey = (tenantId, propertyId) => `${String(tenantId || '').trim().toLowerCase()}::${String(propertyId || '').trim().toLowerCase()}`;

    const getLeasePriority = (status) => {
      const s = String(status || '').toLowerCase();
      if (s === 'active') return 100;
      if (s === 'signed') return 80;
      if (s === 'partially_signed' || s === 'pending_tenant') return 60;
      if (s === 'pending' || s === 'draft') return 40;
      return 20; // past, expired, terminated
    };

    const tenancyMap = new Map();

    // Map leases first (primary source of truth)
    leasesRes.rows.forEach(l => {
      if (!l.tenant_id || !l.property_id) return;
      const key = makeTenancyKey(l.tenant_id, l.property_id);

      const isSigned = !!l.tenant_signed_at || l.lease_status === 'signed' || l.lease_status === 'active';
      const isActive = l.lease_status === 'active';
      const isPending = !isActive && l.lease_status !== 'past' && l.lease_status !== 'expired' && l.lease_status !== 'terminated';

      let status = 'past';
      if (isActive) status = 'active';
      else if (isPending) status = 'pending';

      let badgeLabel = 'Active Tenant';
      if (!isActive) {
        if (!isSigned) badgeLabel = 'Pending Signature';
        else badgeLabel = 'Pending Sign & Pay';
      }

      if (tenancyMap.has(key)) {
        const existing = tenancyMap.get(key);
        if (l.lease_id && !existing.leaseIds.includes(l.lease_id)) {
          existing.leaseIds.push(l.lease_id);
        }
        if (l.application_id && !existing.applicationIds.includes(l.application_id)) {
          existing.applicationIds.push(l.application_id);
        }
        // Promote to active/higher priority lease if this lease has higher ranking
        if (getLeasePriority(l.lease_status) > getLeasePriority(existing.rawLeaseStatus)) {
          existing.leaseId = l.lease_id;
          existing.rawLeaseStatus = l.lease_status;
          existing.status = status;
          existing.leaseStatus = badgeLabel;
          existing.rentAmount = Number(l.rent_amount || 0);
          existing.rentPeriod = l.rent_period || existing.rentPeriod;
          existing.startDate = l.start_date;
          existing.endDate = l.end_date;
          if (l.start_date) existing.dueDate = l.start_date;
          existing.paymentStatus = isActive ? "Paid" : "Unpaid";
        }
        if (!existing.phone && l.tenant_phone) existing.phone = l.tenant_phone;
        if (!existing.avatar && l.avatar_url) existing.avatar = l.avatar_url;
      } else {
        tenancyMap.set(key, {
          tenancyKey: key,
          id: String(l.tenant_id),
          tenantId: String(l.tenant_id),
          propertyId: String(l.property_id),
          leaseId: l.lease_id,
          leaseIds: l.lease_id ? [l.lease_id] : [],
          applicationIds: l.application_id ? [l.application_id] : [],
          name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Tenant',
          firstName: l.first_name || '',
          lastName: l.last_name || '',
          email: l.tenant_email || '',
          phone: l.tenant_phone || '',
          avatar: l.avatar_url || '',
          propertyTitle: l.property_title || 'Leased Property',
          currentAddress: l.property_address || l.property_title || '',
          status: status,
          leaseStatus: badgeLabel,
          rawLeaseStatus: l.lease_status,
          rentAmount: Number(l.rent_amount || 0),
          rentPeriod: l.rent_period || 'monthly',
          startDate: l.start_date,
          endDate: l.end_date,
          emergencyContact: l.emergency_contact || l.guarantor_phone || '',
          occupation: l.occupation || l.employment_status || '',
          guarantorName: l.guarantor_name || '',
          guarantorPhone: l.guarantor_phone || '',
          dueDate: l.start_date || "—",
          paymentStatus: isActive ? "Paid" : "Unpaid",
          unpaidCount: 0,
          unpaidInvoicesCount: 0,
          invoices: []
        });
      }
    });

    // Map applications: only emit if no lease covers that tenant_id::property_id
    appsRes.rows.forEach(a => {
      if (!a.tenant_id || !a.property_id) return;
      const key = makeTenancyKey(a.tenant_id, a.property_id);

      if (tenancyMap.has(key)) {
        // Lease already covers this pair -> attach application ID, do not emit duplicate card
        const existing = tenancyMap.get(key);
        if (a.application_id && !existing.applicationIds.includes(a.application_id)) {
          existing.applicationIds.push(a.application_id);
        }
        if (!existing.phone && a.tenant_phone) existing.phone = a.tenant_phone;
        if (!existing.avatar && a.avatar_url) existing.avatar = a.avatar_url;
        return;
      }

      const s = (a.application_status || '').toLowerCase();
      const isApprovedOrSent = s === 'approved' || s === 'lease_generated' || s === 'pending_tenant' || s === 'signed' || s === 'moved_in' || s === 'leased' || s === 'active';
      if (!isApprovedOrSent) return;

      // Applications without a lease appear as Pending only, never as a second Active card
      tenancyMap.set(key, {
        tenancyKey: key,
        id: String(a.tenant_id),
        tenantId: String(a.tenant_id),
        propertyId: String(a.property_id),
        leaseId: null,
        leaseIds: [],
        applicationIds: [a.application_id],
        name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Tenant',
        firstName: a.first_name || '',
        lastName: a.last_name || '',
        email: a.tenant_email || '',
        phone: a.tenant_phone || '',
        avatar: a.avatar_url || '',
        propertyTitle: a.property_title || 'Leased Property',
        currentAddress: a.property_address || a.property_title || '',
        status: 'pending',
        leaseStatus: 'Pending Sign & Pay',
        rawLeaseStatus: null,
        rentAmount: Number(a.rent_amount || 0),
        rentPeriod: a.rent_period || 'monthly',
        startDate: null,
        endDate: null,
        emergencyContact: a.emergency_contact || a.guarantor_phone || '',
        occupation: a.occupation || a.employment_status || '',
        guarantorName: a.guarantor_name || '',
        guarantorPhone: a.guarantor_phone || '',
        dueDate: "—",
        paymentStatus: "Unpaid",
        unpaidCount: 0,
        unpaidInvoicesCount: 0,
        invoices: []
      });
    });

    // Attach invoices to existing tenancies (never create a card from an invoice)
    const tenancies = Array.from(tenancyMap.values());
    invsRes.rows.forEach(inv => {
      let target = null;
      if (inv.lease_id) {
        target = tenancies.find(t => t.leaseIds.includes(inv.lease_id));
      }
      if (!target && inv.application_id) {
        target = tenancies.find(t => t.applicationIds.includes(inv.application_id));
      }
      if (!target && inv.tenant_id && inv.property_id) {
        target = tenancyMap.get(makeTenancyKey(inv.tenant_id, inv.property_id));
      }

      if (target) {
        target.invoices.push({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          amount: Number(inv.amount || 0),
          status: inv.status,
          dueDate: inv.due_date,
          issueDate: inv.issue_date
        });

        const invStatus = String(inv.status || '').toLowerCase();
        const isUnpaid = invStatus === 'unpaid' || invStatus === 'overdue' || invStatus === 'pending_verification' || invStatus === 'pending';
        if (isUnpaid) {
          target.unpaidCount += 1;
          target.unpaidInvoicesCount += 1;
          target.paymentStatus = (invStatus === 'overdue') ? 'Overdue' : 'Unpaid';
          if (inv.due_date) {
            target.dueDate = inv.due_date;
          }
        }
      }
    });

    console.log(`[getLandlordTenants] landlord ${landlordId}: ${leasesRes.rows.length} leases, ${appsRes.rows.length} apps, ${invsRes.rows.length} invoices -> ${tenancyMap.size} unique tenancies`);
    for (const [k, t] of tenancyMap.entries()) {
      console.log(`[getLandlordTenants] Tenancy [${k}]: ${t.leaseIds.length} leases, ${t.applicationIds.length} apps, ${t.invoices.length} invoices (${t.unpaidCount} unpaid)`);
    }

    res.json({
      success: true,
      tenants: Array.from(tenancyMap.values()),
      counts: {
        leaseRows: leasesRes.rows.length,
        appRows: appsRes.rows.length,
        invoiceRows: invsRes.rows.length,
        uniqueTenancies: tenancyMap.size
      }
    });
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

    invalidateUserStatusCache(userId);

    res.json({
      success: true,
      message: 'Your account has been deactivated/closed. If you ever wish to restore your account, contact Admin.',
      user: softDeleted
    });
  }),

  payRestorationFee: asyncHandler(async (req, res) => {
    return res.status(400).json({
      error: 'Online payment gateway is not integrated yet. Please contact admin to confirm payment and restore your account.'
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
    const cleanEmail = newEmail.trim().toLowerCase();
    emailVerificationCodes.set(userId, { newEmail: cleanEmail, code, expiresAt: Date.now() + 10 * 60 * 1000 });

    await sendVerificationCodeEmail({
      to: cleanEmail,
      code,
      purpose: 'email_change'
    });

    const responsePayload = {
      success: true,
      message: `Verification code sent to ${newEmail}`
    };

    if (!isEmailEnabled() && process.env.NODE_ENV !== 'production') {
      responsePayload.demoCode = code;
    }

    res.json(responsePayload);
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
  }),

  inviteTenant: asyncHandler(async (req, res) => {
    // Only landlords (or admins) should invite tenants
    const role = req.user.role || req.user.primary_role;
    if (role !== 'landlord' && role !== 'admin') {
      return res.status(403).json({ error: 'Only landlords can invite tenants.' });
    }

    const { firstName, lastName, email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    let existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const defaultPassword = 'LodaleTenant2026!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    const newUser = await UserModel.create({
      firstName: firstName || '',
      lastName: lastName || '',
      email: email.trim().toLowerCase(),
      hashedPassword: hashedPassword,
      phone: '',
      role: 'tenant'
    });

    // Mark user as invited
    await pool.query("UPDATE users SET account_status = 'invited' WHERE id = $1", [newUser.id]);

    // Create an empty tenant profile
    await pool.query('INSERT INTO tenant_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [newUser.id]);

    res.status(201).json({
      success: true,
      message: 'Tenant invited successfully',
      user: newUser,
      defaultPassword
    });
  })
};
