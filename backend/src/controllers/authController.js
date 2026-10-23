import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel.js';
import { ProfileModel } from '../models/profileModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const passwordResetCodes = new Map();
const usedResetTokens = new Set();

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
      if (existingUser.account_status === 'invited') {
        return res.status(400).json({ error: 'You have been invited by a landlord. Please check your email for your default login credentials and sign in instead.' });
      }
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

    const status = (user.account_status || 'active').toLowerCase();
    if (status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support for assistance.' });
    }

    if (status === 'deleted_by_user' || status === 'deactivated' || status === 'archived') {
      return res.status(403).json({
        error: 'Your account is deactivated/closed. If you wish to reactivate your account, contact admin for account restoration.',
        isDeactivated: true,
        email: user.email
      });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let isMatch = false;
    if (user.password_hash) {
      try {
        isMatch = await bcrypt.compare(password, user.password_hash);
      } catch (err) {
        console.error('[Auth bcrypt error]', err);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { password_hash, ...safeUser } = user;
    const token = jwt.sign({ id: user.id, email: user.email, role: user.primary_role, primary_role: user.primary_role }, JWT_SECRET, { expiresIn: '7d' });

    if (status === 'pending_restoration_fee') {
      return res.status(402).json({
        error: `Account restoration fee of ₦${Number(user.restoration_fee_amount || 5000).toLocaleString()} is required before accessing your account.`,
        requiresRestorationFee: true,
        restorationFeeAmount: Number(user.restoration_fee_amount || 5000),
        user: safeUser,
        token
      });
    }

    res.json({ user: safeUser, token, isInvited: status === 'invited' });
  }),

  getMe: asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    // Always return a generic success message to prevent user enumeration
    const genericResponse = {
      success: true,
      message: 'If an account exists with this email, instructions to reset your password have been sent.'
    };

    if (!cleanEmail) {
      return res.json(genericResponse);
    }

    const user = await UserModel.findByEmail(cleanEmail);
    const status = (user?.account_status || 'active').toLowerCase();

    if (user && status === 'active') {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const resetToken = jwt.sign(
        { id: user.id, email: cleanEmail, purpose: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      passwordResetCodes.set(cleanEmail, {
        code,
        userId: user.id,
        token: resetToken,
        expiresAt: Date.now() + 15 * 60 * 1000
      });

      const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
      const resetUrl = `${frontendBase}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(cleanEmail)}`;

      try {
        await sendPasswordResetEmail({
          to: cleanEmail,
          resetUrl,
          code
        });
      } catch (err) {
        console.error('[authController.forgotPassword] Email send error:', err.message);
      }
    }

    return res.json(genericResponse);
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const { email, code, token, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    let targetUserId = null;
    let targetEmail = null;

    if (token) {
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(400).json({ error: 'Password reset link is invalid or has expired. Please request a new one.' });
      }

      if (decoded.purpose !== 'password_reset' || !decoded.id) {
        return res.status(400).json({ error: 'Invalid password reset token.' });
      }

      if (usedResetTokens.has(token)) {
        return res.status(400).json({ error: 'This password reset link has already been used. Please request a new one.' });
      }

      targetUserId = decoded.id;
      targetEmail = decoded.email?.toLowerCase();
      usedResetTokens.add(token);
    } else if (email && code) {
      const cleanEmail = email.trim().toLowerCase();
      const record = passwordResetCodes.get(cleanEmail);

      if (!record || record.expiresAt < Date.now()) {
        return res.status(400).json({ error: 'Verification code has expired or was not requested. Please request a new code.' });
      }

      if (record.code !== String(code).trim()) {
        return res.status(400).json({ error: 'Invalid verification code.' });
      }

      targetUserId = record.userId;
      targetEmail = cleanEmail;
      if (record.token) {
        usedResetTokens.add(record.token);
      }
    } else {
      return res.status(400).json({ error: 'Either a reset token or both email and verification code must be provided.' });
    }

    const user = await UserModel.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await UserModel.updatePassword(user.id, hashedPassword);

    if (targetEmail) {
      passwordResetCodes.delete(targetEmail);
    }

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    });
  })
};
