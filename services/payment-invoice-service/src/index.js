const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const { logger } = require('./config/logger');
const { dbPool } = require('./config/database');
const { initKafka } = require('./config/kafka');
const { metricsMiddleware, metricsEndpoint } = require('./middleware/metrics');
const { correlationIdMiddleware } = require('./middleware/correlation');
const { errorHandler } = require('./middleware/errorHandler');
const paymentRoutes = require('./routes/payment.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const healthRoutes = require('./routes/health.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3010',
  credentials: true
}));

// Parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Observability middleware
app.use(correlationIdMiddleware);
app.use(metricsMiddleware);

// Routes
app.use('/health', healthRoutes);
app.use('/metrics', metricsEndpoint);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/invoices', invoiceRoutes);

// Error handling
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, starting graceful shutdown...');
  
  try {
    await dbPool.end();
    logger.info('Database connections closed');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await dbPool.query('SELECT NOW()');
    logger.info('Database connection established');

    // Initialize Kafka
    await initKafka();
    logger.info('Kafka producer initialized');

    app.listen(PORT, () => {
      logger.info(`Payment-Invoice Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
