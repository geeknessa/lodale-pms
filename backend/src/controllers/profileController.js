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

    if (matches) {
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB strict limit
    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({ error: 'Image file exceeds the 2MB size limit.' });
    }

    // Magic bytes validation: strictly allow only JPEG, PNG, and WebP (no SVG, GIF, or script payloads)
    let ext = null;
    if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      ext = '.jpg';
    } else if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0D &&
      buffer[5] === 0x0A &&
      buffer[6] === 0x1A &&
      buffer[7] === 0x0A
    ) {
      ext = '.png';
    } else if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && // 'RIFF'
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50  // 'WEBP'
    ) {
      ext = '.webp';
    }

    if (!ext) {
      return res.status(400).json({ error: 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.' });
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
