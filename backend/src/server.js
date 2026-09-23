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
import { errorHandler } from './middlewares/errorMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'sha256-RrBFl9ujuxpmpWzstaoC7DV6YEJAFKNN4XGtiNOmvvI='"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
      connectSrc: ["'self'", "*"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit each IP to 2000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', apiLimiter);

// Allowed origins for CORS
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''));

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Allow non-browser, server-to-server, or same-origin requests
  const cleanOrigin = origin.replace(/\/$/, '');
  if (process.env.NODE_ENV !== 'production') return true;
  if (allowedOrigins.includes('*') || allowedOrigins.includes(cleanOrigin)) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0|(10|172\.(1[6-9]|2[0-9]|3[0-1])|192\.168)\.\d+\.\d+)(:\d+)?$/i.test(cleanOrigin);
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Global process exception handlers to prevent unexpected crashes
process.on('uncaughtException', (err) => {
  console.error('[Server Uncaught Exception]:', err.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server Unhandled Rejection]:', reason);
});

// Initialize Database
initDb();

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
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` Lodale Express Backend running on http://localhost:${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(`=================================================`);
  });
}

export default app;
