const express = require('express');
const router = express.Router();
const { dbPool, getPoolMetrics } = require('../config/database');
const { getCircuitBreakerStats } = require('../config/paypal');
const { producer } = require('../config/kafka');

/**
 * Liveness probe - Is the service running?
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'payment-invoice-service',
    timestamp: new Date().toISOString()
  });
});

/**
 * Readiness probe - Is the service ready to accept traffic?
 */
router.get('/ready', async (req, res) => {
  const checks = {
    database: false,
    kafka: false
  };

  try {
    // Check database
    await dbPool.query('SELECT 1');
    checks.database = true;

    // Check Kafka (producer connected)
    checks.kafka = producer._producer && producer._producer.isConnected();

    const isReady = Object.values(checks).every(check => check === true);

    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      checks,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Detailed health check with diagnostics
 */
router.get('/', async (req, res) => {
  try {
    const poolMetrics = getPoolMetrics();
    const circuitBreakerStats = getCircuitBreakerStats();

    // Database check
    const dbStart = Date.now();
    await dbPool.query('SELECT NOW()');
    const dbLatency = Date.now() - dbStart;

    res.status(200).json({
      status: 'healthy',
      service: 'payment-invoice-service',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: {
          status: 'connected',
          latency: `${dbLatency}ms`,
          pool: poolMetrics
        },
        kafka: {
          status: producer._producer?.isConnected() ? 'connected' : 'disconnected'
        },
        paypal: {
          circuitBreakers: circuitBreakerStats
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

module.exports = router;
