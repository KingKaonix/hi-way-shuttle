import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';

import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authenticate, requireRole } from './middleware/auth';

import authRoutes from './routes/auth';
import routeRoutes from './routes/routes';
import bookingRoutes from './routes/bookings';
import tripRoutes from './routes/trips';
import driverRoutes from './routes/drivers';

const app = express();

// --- Middleware ---
app.use(cors({ origin: config.corsOrigin }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/drivers', driverRoutes);

// --- Health ---
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    version: '2.0.0',
  });
});

// --- Admin status ---
app.get('/api/admin/status', authenticate, requireRole('admin'), (_req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    uptime: process.uptime(),
  });
});

// --- Serve built React app ---
const webDist = path.join(__dirname, '..', '..', 'web', 'dist');
app.use(express.static(webDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(webDist, 'index.html'));
});

// --- Error handler ---
app.use(errorHandler);

export default app;
