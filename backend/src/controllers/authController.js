import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'lodale_secret_key_2026';

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, role = 'tenant', phone = '' } = req.body;

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await UserModel.create({ firstName, lastName, email, hashedPassword, phone, role });

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.primary_role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user: newUser, token });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1. Check for constant admin
    const ADMIN_USERNAMES = ['admin', 'admin@lodale.com', 'system.admin@lodale.com'];
    const ALLOWED_ADMIN_PASSWORDS = ['555555', 'admin', 'admin123', 'password', 'lodale'];
    const ADMIN_PASSWORD_HASH = '$2a$10$oGLTVt6pnp30pVGSiVmAmu8FgTjGo/2IYOD/gZhzhaaY/obTdBdlK';

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPassword = password ? password.trim() : '';

    if (ADMIN_USERNAMES.includes(cleanEmail)) {
      let isMatch = ALLOWED_ADMIN_PASSWORDS.includes(cleanPassword);
      if (!isMatch && cleanPassword) {
        try {
          isMatch = await bcrypt.compare(cleanPassword, ADMIN_PASSWORD_HASH);
        } catch (_e) {}
      }

      if (isMatch) {
        let dbAdmin = await UserModel.findByEmail('admin@lodale.com');
        if (!dbAdmin) {
          dbAdmin = await UserModel.findByEmail('admin');
        }
        const adminUser = dbAdmin || {
          id: 'constant_admin_id',
          email: 'admin@lodale.com',
          first_name: 'System',
          last_name: 'Admin',
          primary_role: 'admin'
        };
        const token = jwt.sign({ id: adminUser.id, email: adminUser.email, role: adminUser.primary_role || 'admin' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ user: adminUser, token });
      }
    }

    // 2. Regular user login flow
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
    const token = jwt.sign({ id: user.id, email: user.email, role: user.primary_role }, JWT_SECRET, { expiresIn: '7d' });

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
