const { Pool } = require('pg');
const { logger } = require('./logger');

const dbPool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'smartautocheck_db',
  user: process.env.POSTGRES_USER || 'smartautocheck',
  password: process.env.POSTGRES_PASSWORD || 'smartautocheck_pass',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Connection pool error handling
dbPool.on('error', (err) => {
  logger.error('Unexpected database error:', err);
});

// Export metrics for monitoring
const getPoolMetrics = () => ({
  totalConnections: dbPool.totalCount,
  idleConnections: dbPool.idleCount,
  waitingRequests: dbPool.waitingCount
});

module.exports = { dbPool, getPoolMetrics };
