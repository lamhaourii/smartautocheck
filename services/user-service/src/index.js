const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { logger } = require('./config/logger');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { startCronJobs } = require('./cron/cleanupTokens');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoints
app.get('/health/live', (req, res) => {
  res.json({ status: 'ok', service: 'user-service', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ 
      status: 'ready', 
      service: 'user-service',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'not_ready', 
      error: error.message,
      timestamp: new Date().toISOString() 
    });
  }
});

app.get('/health', async (req, res) => {
  try {
    const dbStart = Date.now();
    await db.query('SELECT NOW()');
    const dbLatency = Date.now() - dbStart;

    res.json({
      status: 'healthy',
      service: 'user-service',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: {
          status: 'connected',
          latency: `${dbLatency}ms`
        }
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server
app.listen(PORT, async () => {
  logger.info(`User Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start cron jobs
  startCronJobs();
  
  // Test database connection
  try {
    await db.query('SELECT NOW()');
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Database connection failed:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  try {
    await db.end();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  try {
    await db.end();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database:', error);
  }
  process.exit(0);
});

module.exports = app;
