import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initDb } from './db/db.js';
import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';
import profileRoutes from './routes/profile.js';
import supportRoutes from './routes/support.js';
import applicationRoutes from './routes/applications.js';
import chatRoutes from './routes/chat.js';
import leaseRoutes from './routes/leases.js';
import rentRoutes from './routes/rent.js';
import maintenanceRoutes from './routes/maintenance.js';
import notificationRoutes from './routes/notifications.js';
import inspectionRoutes from './routes/inspections.js';
import ratingRoutes from './routes/ratingRoutes.js';
import path from 'path';
import fs from 'fs';
import { getUploadsDir } from './services/uploadService.js';
import { autoApprovalService } from './services/autoApprovalService.js';
import { errorHandler } from './middlewares/errorMiddleware.js';
import { handlePaystackWebhook } from './controllers/rentController.js';

dotenv.config();

// Hard production guard
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('[FATAL] In production, JWT_SECRET must be set and at least 32 characters long.');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('[FATAL] In production, DATABASE_URL environment variable is required.');
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Configurable uploads directory (temporary local default; move to cloud storage next)
const isDefaultUploadsDir = !process.env.UPLOADS_DIR;
const uploadsDir = getUploadsDir();

if (process.env.NODE_ENV === 'production' && isDefaultUploadsDir) {
  console.warn('[STORAGE WARNING] UPLOADS_DIR is using the local default path in production. Configure a dedicated persistent volume or cloud storage to avoid data loss across deployments.');
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// Allowed origins for CORS
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Allow non-browser, server-to-server, or same-origin requests
  const cleanOrigin = origin.replace(/\/$/, '');

  // Keep development-friendly behavior when NODE_ENV !== 'production'
  if (process.env.NODE_ENV !== 'production') {
    const devAllowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000')
      .split(',')
      .map(o => o.trim().replace(/\/$/, ''));
    if (devAllowedOrigins.includes('*') || devAllowedOrigins.includes(cleanOrigin)) return true;
    return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0|(10|172\.(1[6-9]|2[0-9]|3[0-1])|192\.168)\.\d+\.\d+)(:\d+)?$/i.test(cleanOrigin);
  }

  // In production: strictly allow only explicitly listed origins in process.env.CORS_ORIGIN
  // NEVER allow '*' or private IP ranges by default
  const productionAllowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))
    .filter(o => o.length > 0 && o !== '*');

  return productionAllowedOrigins.includes(cleanOrigin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security Middlewares
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Static uploads serving with safe cross-origin resource sharing headers
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

const isDev = process.env.NODE_ENV !== 'production';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100000 : 2000, // Raised substantially in development to prevent dashboard lockouts
  skip: () => isDev, // Disable global rate limiting in development only
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/', apiLimiter);

// Paystack webhook endpoint: mounted before express.json to receive raw body for HMAC SHA512 signature verification
app.post(
  ['/api/rent/paystack/webhook', '/api/paystack/webhook'],
  express.raw({ type: '*/*' }),
  handlePaystackWebhook
);

// Body parser limits reduced from 50mb to 10mb to mitigate Denial-of-Service (DoS) and excessive memory overhead from oversized payloads while still accommodating reasonable uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Global process exception handlers
process.on('uncaughtException', (err) => {
  console.error('[Server Uncaught Exception]:', err.stack || err.message || err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server Unhandled Rejection]:', reason);
});

// Initialize Database and Services
initDb();
if (process.env.NODE_ENV !== 'test') {
  autoApprovalService.startAutoApprovalWorker(10000);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/rent', rentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/ratings', ratingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Lodale PMS Express Backend',
    timestamp: new Date().toISOString(),
  });
});

// Central Error Handler Middleware
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` Lodale Express Backend running on http://localhost:${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(`=================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Error] Port ${PORT} is already in use by another running instance.`);
      console.error(`Close the existing process on port ${PORT} before starting a new server.`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}

export default app;
