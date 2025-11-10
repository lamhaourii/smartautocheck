const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getBreakerStats } = require('../middleware/circuitBreaker');

/**
 * Service endpoints for health checks
 */
const services = {
  'user-service': process.env.USER_SERVICE_URL || 'http://user-service:3001',
  'appointment-service': process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3002',
  'payment-invoice-service': process.env.PAYMENT_INVOICE_SERVICE_URL || 'http://payment-invoice-service:3004',
  'inspection-certification-service': process.env.INSPECTION_CERTIFICATION_SERVICE_URL || 'http://inspection-certification-service:3005'
};

/**
 * Check health of a single service
 */
async function checkServiceHealth(serviceName, serviceUrl) {
  try {
    const response = await axios.get(`${serviceUrl}/health`, {
      timeout: 3000
    });
    
    return {
      name: serviceName,
      status: 'healthy',
      url: serviceUrl,
      responseTime: response.headers['x-response-time'] || 'N/A',
      details: response.data
    };
  } catch (error) {
    return {
      name: serviceName,
      status: 'unhealthy',
      url: serviceUrl,
      error: error.message
    };
  }
}

/**
 * Liveness probe
 * Simple check if API Gateway is running
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

/**
 * Readiness probe
 * Checks if API Gateway can handle requests
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if at least one downstream service is available
    const healthChecks = await Promise.allSettled(
      Object.entries(services).map(([name, url]) =>
        axios.get(`${url}/health/live`, { timeout: 2000 })
      )
    );

    const anyServiceUp = healthChecks.some(result => result.status === 'fulfilled');

    if (anyServiceUp) {
      res.json({
        status: 'ready',
        service: 'api-gateway',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        message: 'No downstream services available',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Detailed health check
 * Aggregates health from all downstream services
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();

  try {
    // Check all services in parallel
    const healthPromises = Object.entries(services).map(([name, url]) =>
      checkServiceHealth(name, url)
    );

    const serviceHealths = await Promise.all(healthPromises);

    // Calculate overall health
    const allHealthy = serviceHealths.every(s => s.status === 'healthy');
    const someHealthy = serviceHealths.some(s => s.status === 'healthy');

    // Get circuit breaker stats
    const breakerStats = getBreakerStats();

    const response = {
      status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
      service: 'api-gateway',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      responseTime: `${Date.now() - startTime}ms`,
      downstream: {
        services: serviceHealths,
        summary: {
          total: serviceHealths.length,
          healthy: serviceHealths.filter(s => s.status === 'healthy').length,
          unhealthy: serviceHealths.filter(s => s.status === 'unhealthy').length
        }
      },
      circuitBreakers: breakerStats
    };

    const statusCode = allHealthy ? 200 : someHealthy ? 207 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'api-gateway',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
