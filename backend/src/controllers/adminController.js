import { AdminModel } from '../models/adminModel.js';
import { PropertyModel } from '../models/propertyModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const adminController = {
  getPendingProperties: asyncHandler(async (req, res) => {
    const properties = await AdminModel.getPendingProperties();

    const formatted = await Promise.all(properties.map(async p => {
      const amenities = await PropertyModel.getAmenities(p.id);

      return {
        id: p.id,
        title: p.title,
        location: `${p.address_line1}, ${p.city}`,
        price: `₦${Number(p.rent_amount).toLocaleString()}/yr`,
        type: p.property_type,
        status: p.status === 'pending_review' ? (p.queue_status === 'under_review' ? 'Info Requested' : 'Pending Approval') : 'Draft',
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
        adminNotes: p.admin_notes,
        ownershipDoc: p.ownership_doc,
        ownershipDocUrl: p.ownership_doc_url,
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

    const formatted = users.map(u => ({
      id: u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
      email: u.email,
      phone: u.phone_number || '',
      role: (u.primary_role || 'Tenant').toLowerCase().includes('landlord') ? 'Landlord' : ((u.primary_role || '').toLowerCase().includes('admin') ? 'Admin' : 'Tenant'),
      status: 'Active',
      joinedDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      listingsCount: (u.primary_role || '').toLowerCase().includes('landlord') ? 1 : 0,
      verifications: [
        u.id_verification_status === 'verified' ? 'ID Verified' : 'ID Pending',
        'Email Verified'
      ]
    }));

    res.json(formatted);
  })
};
