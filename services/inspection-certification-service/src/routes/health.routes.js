const express = require('express');
const router = express.Router();
const { dbPool, getPoolMetrics } = require('../config/database');
const { producer, consumer } = require('../config/kafka');

router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'inspection-certification-service',
    timestamp: new Date().toISOString()
  });
});

router.get('/ready', async (req, res) => {
  const checks = {
    database: false,
    kafka: false
  };

  try {
    await dbPool.query('SELECT 1');
    checks.database = true;

    checks.kafka = producer._producer?.isConnected() && consumer.isRunning();

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

router.get('/', async (req, res) => {
  try {
    const poolMetrics = getPoolMetrics();
    const dbStart = Date.now();
    await dbPool.query('SELECT NOW()');
    const dbLatency = Date.now() - dbStart;

    res.status(200).json({
      status: 'healthy',
      service: 'inspection-certification-service',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: {
          status: 'connected',
          latency: `${dbLatency}ms`,
          pool: poolMetrics
        },
        kafka: {
          producer: producer._producer?.isConnected() ? 'connected' : 'disconnected',
          consumer: consumer.isRunning() ? 'running' : 'stopped'
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
