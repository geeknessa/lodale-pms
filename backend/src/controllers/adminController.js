import { AdminModel } from '../models/adminModel.js';
import { PropertyModel } from '../models/propertyModel.js';
import { UserModel } from '../models/userModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { clearDatabase } from '../config/db.js';

export const adminController = {
  getPendingProperties: asyncHandler(async (req, res) => {
    const properties = await AdminModel.getAllProperties();

    const formatted = await Promise.all(properties.map(async p => {
      const amenities = await PropertyModel.getAmenities(p.id);
      const blocks = await PropertyModel.getBlocks(p.id);
      const units = await PropertyModel.getUnits(p.id);

      let statusLabel = 'Pending Approval';
      const s = (p.status || '').toString().toLowerCase();
      if (s === 'active_vacant' || s === 'approved' || s === 'live' || s === 'active' || s === 'occupied' || s === 'active_occupied') {
        statusLabel = 'Live';
      } else if (s === 'inactive' || s === 'rejected') {
        statusLabel = 'Rejected';
      } else if (s === 'pending_review' || s === 'pending' || s === 'draft' || !p.status) {
        statusLabel = p.queue_status === 'under_review' ? 'Info Requested' : 'Pending Approval';
      }

      return {
        id: p.id,
        title: p.title,
        rent_amount: p.rent_amount || p.rent || 0,
        rent_period: p.rent_period || 'per annum',
        price: `₦${Number(p.rent_amount || p.rent || 0).toLocaleString()}${String(p.rent_period || '').toLowerCase().includes('month') ? '/mo' : '/yr'}`,
        type: p.property_type,
        status: statusLabel,
        rawStatus: p.status,
        submittedAt: p.created_at,
        landlord: {
          id: p.landlord_id,
          name: `${p.landlord_first_name || 'Landlord'} ${p.landlord_last_name || ''}`.trim(),
          email: p.landlord_email,
          phone: p.landlord_phone,
        },
        description: p.description,
        amenities,
        blocks,
        units,
        adminNotes: p.admin_notes,
        ownershipDoc: p.ownership_doc,
        ownershipDocUrl: p.ownership_doc_url,
        ownershipDocType: p.ownership_doc_type,
        coverImage: p.cover_image,
        images: p.images,
        latitude: p.latitude,
        longitude: p.longitude,
      };
    }));

    res.json(formatted);
  }),

  reviewProperty: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action, reason, notes } = req.body;

    let newPropertyStatus = 'pending_review';
    let newQueueStatus = 'queued';
    let rejectionReason = reason || notes || null;

    if (action === 'approve') {
      newPropertyStatus = 'active_vacant';
      newQueueStatus = 'approved';
    } else if (action === 'reject') {
      newPropertyStatus = 'inactive';
      newQueueStatus = 'rejected';
    } else if (action === 'request_info') {
      newPropertyStatus = 'pending_review';
      newQueueStatus = 'under_review';
    }

    const property = await AdminModel.updatePropertyStatus(id, newPropertyStatus);
    if (!property) {
      return res.status(404).json({ error: 'Property listing not found.' });
    }

    await AdminModel.updateQueueStatus(property.id, newQueueStatus, rejectionReason);

    res.json({
      property,
      action,
      status: newPropertyStatus,
      queue_status: newQueueStatus,
      message: action === 'approve'
        ? `Property "${property.title}" approved and is now active & live!`
        : (action === 'reject'
          ? `Property "${property.title}" rejected.`
          : `Information requested for "${property.title}".`)
    });
  }),

  getUsers: asyncHandler(async (req, res) => {
    const users = await AdminModel.getAllUsers();

    const formatted = users.map(u => {
      const rawRole = (u.primary_role || 'tenant').toString().toLowerCase();
      const role = rawRole.includes('admin') ? 'Admin' : (rawRole.includes('landlord') ? 'Landlord' : 'Tenant');
      const isSuspended = (u.account_status || 'active').toString().toLowerCase() === 'suspended';
      return {
        id: u.id,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
        email: u.email,
        phone: u.phone_number || '',
        role,
        status: isSuspended ? 'Suspended' : 'Active',
        joinedDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        listingsCount: u.listings_count ?? (role === 'Landlord' ? 1 : 0),
        verifications: [
          u.id_verification_status === 'verified' ? 'ID Verified' : 'ID Pending',
          'Email Verified'
        ]
      };
    });

    res.json(formatted);
  }),

  updateUserStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const normalizedStatus = (status || '').toLowerCase();
    if (!['active', 'suspended'].includes(normalizedStatus)) {
      return res.status(400).json({ error: 'Invalid status. Must be "active" or "suspended".' });
    }

    const updatedUser = await UserModel.updateUserStatus(id, normalizedStatus);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      message: `User ${updatedUser.first_name || updatedUser.email} account status updated to ${normalizedStatus}.`,
      user: updatedUser
    });
  }),

  deleteUser: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedUser = await AdminModel.deleteUser(id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found or already deleted.' });
    }

    res.json({
      message: `User ${deletedUser.first_name || deletedUser.email} deleted successfully from database.`,
      user: deletedUser
    });
  }),

  resetDatabase: asyncHandler(async (req, res) => {
    const result = await clearDatabase();
    res.json(result);
  })
};

