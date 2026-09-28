import jwt from 'jsonwebtoken';
import { pool } from '../db/db.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is required.');
  process.exit(1);
}

// In-memory cache for user account status (30-60s TTL)
const userStatusCache = new Map();
const CACHE_TTL_MS = 45 * 1000;

export const invalidateUserStatusCache = (userId) => {
  if (userId) {
    userStatusCache.delete(userId);
  }
};

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user to request object
    req.user = decoded;

    // Admin account must never be locked out
    if (decoded.role === 'admin' || decoded.primary_role === 'admin') {
      return next();
    }

    // Check account_status in DB/cache
    const userId = decoded.id;
    let userRecord = null;
    const now = Date.now();
    const cached = userStatusCache.get(userId);

    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      userRecord = cached;
    } else {
      try {
        const result = await pool.query(
          'SELECT id, email, primary_role, account_status, restoration_fee_amount FROM users WHERE id = $1',
          [userId]
        );
        if (result.rows.length === 0) {
          return res.status(401).json({ error: 'Unauthorized: User not found' });
        }
        const row = result.rows[0];
        userRecord = {
          status: (row.account_status || 'active').toLowerCase(),
          restorationFeeAmount: row.restoration_fee_amount,
          email: row.email,
          role: row.primary_role,
          timestamp: now
        };
        userStatusCache.set(userId, userRecord);
      } catch (dbErr) {
        console.error('[authMiddleware] DB error checking user status:', dbErr.message);
        return next();
      }
    }

    if (userRecord.role === 'admin') {
      return next();
    }

    const status = userRecord.status;

    if (status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support for assistance.' });
    }

    if (status === 'deleted_by_user' || status === 'deactivated' || status === 'archived' || status === 'deleted') {
      return res.status(403).json({
        error: 'Your account is deactivated/closed. If you wish to reactivate your account, contact admin for account restoration.',
        isDeactivated: true,
        email: userRecord.email
      });
    }

    if (status === 'pending_restoration_fee') {
      const url = req.originalUrl || req.url || '';
      const isRestorationPath = url.includes('/pay-restoration-fee') || url.endsWith('/me');
      if (!isRestorationPath) {
        return res.status(402).json({
          error: `Account restoration fee of ₦${Number(userRecord.restorationFeeAmount || 5000).toLocaleString()} is required before accessing your account.`,
          requiresRestorationFee: true,
          restorationFeeAmount: Number(userRecord.restorationFeeAmount || 5000)
        });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // Proceed silently if token is missing or invalid in optional mode
  }
  next();
};

export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
