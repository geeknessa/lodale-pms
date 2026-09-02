import { UserModel } from '../models/userModel.js';
import { pool } from '../db/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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
  })
};
