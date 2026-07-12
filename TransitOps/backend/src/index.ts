import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routers
import authRouter from './routes/auth.routes.js';
import fleetRouter from './routes/fleet.routes.js';
import driverRouter from './routes/driver.routes.js';
import tripRouter from './routes/trip.routes.js';
import maintenanceRouter from './routes/maintenance.routes.js';
import expenseRouter from './routes/expense.routes.js';
import analyticsRouter from './routes/analytics.routes.js';
import settingsRouter from './routes/settings.routes.js';

// Import error utilities
import { errorHandler, AppError } from './utils/errors.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS - allow all origins so frontend (file:// or any dev port) can connect
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse incoming JSON requests
app.use(express.json());

// API Base Health check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'TransitOps ERP REST API is active and running',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Mount routers
app.use('/api/auth', authRouter);
app.use('/api/fleet', fleetRouter);
app.use('/api/drivers', driverRouter);
app.use('/api/trips', tripRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/settings', settingsRouter);

// Catch-all route for undefined endpoints
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Centralized error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`[Server] TransitOps backend started successfully on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] Local URL: http://localhost:${PORT}`);
});
