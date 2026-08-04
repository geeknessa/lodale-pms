import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'lodale_secret_key_2026';

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'tenant', phone = '' } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required registration fields.' });
    }

    const existingRes = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (existingRes.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertRes = await pool.query(`
      INSERT INTO users (first_name, last_name, email, password_hash, phone_number, primary_role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, first_name, last_name, email, phone_number, primary_role, created_at
    `, [firstName, lastName, email, hashedPassword, phone, role]);

    const newUser = insertRes.rows[0];
    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.primary_role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error('[Auth Route Error]:', error);
    res.status(500).json({ error: 'Registration failed server error.' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userRes = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userRes.rows[0];
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
  } catch (error) {
    console.error('[Auth Route Error]:', error);
    res.status(500).json({ error: 'Login failed server error.' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const userRes = await pool.query(
      'SELECT id, first_name, last_name, email, phone_number, primary_role, id_verification_status, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: userRes.rows[0] });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
