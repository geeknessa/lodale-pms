import { ProfileModel } from '../models/profileModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const profileController = {
  /**
   * GET /api/profile
   * Returns the role-specific profile for the authenticated user.
   */
  getMyProfile: asyncHandler(async (req, res) => {
    const { id, role } = req.user;

    let profile = null;

    if (role === 'landlord') {
      profile = await ProfileModel.getLandlordProfile(id);
    } else if (role === 'tenant') {
      profile = await ProfileModel.getTenantProfile(id);
    } else {
      // Admin has no role-specific profile table
      return res.json({ profile: null, message: 'Admin accounts have no role-specific profile.' });
    }

    res.json({ profile: profile || {} });
  }),

  /**
   * PUT /api/profile
   * Upserts the role-specific profile for the authenticated user.
   */
  updateMyProfile: asyncHandler(async (req, res) => {
    const { id, role } = req.user;

    let updatedProfile = null;

    if (role === 'landlord') {
      updatedProfile = await ProfileModel.upsertLandlordProfile(id, req.body);
    } else if (role === 'tenant') {
      updatedProfile = await ProfileModel.upsertTenantProfile(id, req.body);
    } else {
      return res.status(403).json({ error: 'Admin accounts cannot have a role-specific profile.' });
    }

    res.json({ profile: updatedProfile });
  }),

  /**
   * GET /api/profile/landlord/:userId
   * Admin-only: fetch a specific landlord's profile.
   */
  getLandlordProfileById: asyncHandler(async (req, res) => {
    const profile = await ProfileModel.getLandlordProfile(req.params.userId);
    if (!profile) return res.status(404).json({ error: 'Landlord profile not found.' });
    res.json({ profile });
  }),

  /**
   * GET /api/profile/tenant/:userId
   * Admin-only: fetch a specific tenant's profile.
   */
  getTenantProfileById: asyncHandler(async (req, res) => {
    const profile = await ProfileModel.getTenantProfile(req.params.userId);
    if (!profile) return res.status(404).json({ error: 'Tenant profile not found.' });
    res.json({ profile });
  }),
};
