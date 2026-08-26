import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel.js';
import { ProfileModel } from '../models/profileModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is required.');
  process.exit(1);
}

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, role = 'tenant', phone = '' } = req.body;

    // Prevent self-registration as admin (Finding 6)
    const safeRole = ['tenant', 'landlord'].includes(role) ? role : 'tenant';

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await UserModel.create({ firstName, lastName, email, hashedPassword, phone, role: safeRole });

    // Auto-create an empty role-specific profile row
    if (newUser.primary_role === 'landlord') {
      await ProfileModel.createEmptyLandlordProfile(newUser.id);
    } else if (newUser.primary_role === 'tenant') {
      await ProfileModel.createEmptyTenantProfile(newUser.id);
    }

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.primary_role, primary_role: newUser.primary_role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user: newUser, token });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // All users (including admin) authenticate via the same bcrypt flow
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if ((user.account_status || '').toLowerCase() === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { password_hash, ...safeUser } = user;
    const token = jwt.sign({ id: user.id, email: user.email, role: user.primary_role, primary_role: user.primary_role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ user: safeUser, token });
  }),

  getMe: asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  })
};
