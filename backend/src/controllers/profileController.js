import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pool } from '../db/db.js';
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

  /**
   * POST /api/profile/avatar
   * Upload user avatar photo to backend disk /uploads/ and update users.avatar_url
   */
  uploadAvatar: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { image } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'No image data provided.' });
    }

    const matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    let buffer;
    let ext = '.jpg';

    if (matches) {
      const mime = matches[1].toLowerCase();
      if (!mime.startsWith('image/')) {
        return res.status(400).json({ error: 'Invalid file type. Only image files are allowed.' });
      }
      if (mime.includes('png')) ext = '.png';
      else if (mime.includes('webp')) ext = '.webp';
      else if (mime.includes('gif')) ext = '.gif';
      else ext = '.jpg';

      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit matching settings UI
    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({ error: 'Image file exceeds the 5MB size limit.' });
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const randomFilename = `avatar-${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadsDir, randomFilename);
    fs.writeFileSync(filePath, buffer);

    const avatarUrl = `/uploads/${randomFilename}`;

    await pool.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [avatarUrl, userId]);

    res.json({ message: 'Avatar uploaded successfully', avatar_url: avatarUrl });
  }),
};
