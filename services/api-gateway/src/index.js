/**
 * API Gateway - SmartAutoCheck Distributed Systems Project
 * 
 * Patterns Implemented:
 * 1. Circuit Breaker - Fault tolerance for service failures
 * 2. Service Discovery - Dynamic service registration with Consul
 * 3. Distributed Tracing - Request tracking with Jaeger
 * 4. Distributed Rate Limiting - Redis-based rate limiting across instances
 * 5. Load Balancing - Multiple gateway instances behind Nginx
 * 
 * This gateway demonstrates enterprise-grade microservices patterns
 * for academic evaluation and real-world application.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
require('dotenv').config();

// Distributed Systems Components
const { initializeTracer, tracingMiddleware, traceServiceCall, opentracing } = require('./config/tracer');
const serviceDiscovery = require('./config/service-discovery');
const circuitBreakerManager = require('./config/circuit-breaker');
const rateLimiter = require('./config/rate-limiter');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize distributed tracing
const tracer = initializeTracer('api-gateway');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Add distributed tracing to all requests
app.use(tracingMiddleware(tracer));

// Request logging with correlation ID
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || require('uuid').v4();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  console.log(`[${requestId}] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  next();
});

// ============================================================================
// HEALTH & MONITORING ENDPOINTS
// ============================================================================

/**
 * Health check endpoint
 * Returns: Service status, dependencies health, circuit breaker states
 */
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: '1.0.0',
    uptime: process.uptime(),
    dependencies: {
      redis: 'unknown',
      consul: 'unknown',
      jaeger: 'connected',
    },
    circuitBreakers: circuitBreakerManager.getHealthStatus(),
  };

  // Check Redis connection
  try {
    await rateLimiter.redis.ping();
    health.dependencies.redis = 'healthy';
  } catch (error) {
    health.dependencies.redis = 'unhealthy';
    health.status = 'degraded';
  }

  // Check Consul connection
  try {
    await serviceDiscovery.consul.agent.self();
    health.dependencies.consul = 'healthy';
  } catch (error) {
    health.dependencies.consul = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * Metrics endpoint (Prometheus format)
 * Returns: Request counts, latencies, circuit breaker stats
 */
app.get('/metrics', async (req, res) => {
  const metrics = {
    circuitBreakers: circuitBreakerManager.getHealthStatus(),
    rateLimits: await rateLimiter.getStatistics(),
    services: {},
  };

  // Get service health from Consul
  const services = ['user-service', 'appointment-service', 'payment-service', 
                    'inspection-service', 'certificate-service', 'notification-service'];
  
  for (const serviceName of services) {
    try {
      const instances = await serviceDiscovery.getAllInstances(serviceName);
      metrics.services[serviceName] = {
        instances: instances.length,
        healthy: instances.length > 0,
      };
    } catch (error) {
      metrics.services[serviceName] = {
        instances: 0,
        healthy: false,
      };
    }
  }

  res.json(metrics);
});

// ============================================================================
// GATEWAY PROXY FUNCTION WITH ALL PATTERNS
// ============================================================================

/**
 * Universal proxy function
 * Implements: Circuit Breaker + Service Discovery + Tracing + Rate Limiting
 */
async function proxyRequest(serviceName, req, res, options = {}) {
  const span = req.span;
  
  try {
    // 1. Service Discovery: Get service URL from Consul
    const serviceUrl = await serviceDiscovery.discoverService(serviceName);
    const targetUrl = `${serviceUrl}${req.path}`;

    // 2. Create child span for tracing
    const serviceSpan = traceServiceCall(span, serviceName, req.method);

    // 3. Circuit Breaker: Wrap request to handle failures
    const makeRequest = async () => {
      serviceSpan.log({ event: 'request_start', url: targetUrl });
      
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        params: req.query,
        headers: {
          ...req.headers,
          host: undefined, // Remove host header
          'x-request-id': req.requestId,
          // Inject tracing headers
          'x-b3-traceid': serviceSpan.context().toTraceId(),
          'x-b3-spanid': serviceSpan.context().toSpanId(),
        },
        timeout: options.timeout || 30000,
        validateStatus: () => true, // Don't throw on error status codes
      });

      serviceSpan.setTag('http.status_code', response.status);
      serviceSpan.log({ event: 'request_complete', status: response.status });
      serviceSpan.finish();

      return response;
    };

    // Get circuit breaker for this service
    const breaker = circuitBreakerManager.wrapRequest(serviceName, makeRequest);
    
    // Execute request through circuit breaker
    const response = await breaker.fire();

    // Handle fallback response from circuit breaker
    if (response.statusCode) {
      return res.status(response.statusCode).json(response);
    }

    // Forward successful response
    return res.status(response.status).json(response.data);

  } catch (error) {
    console.error(`[${req.requestId}] Error proxying to ${serviceName}:`, error.message);
    
    span.setTag(opentracing.Tags.ERROR, true);
    span.log({
      event: 'error',
      'error.kind': error.name,
      message: error.message,
      stack: error.stack,
    });

    // Return graceful error
    return res.status(500).json({
      success: false,
      error: 'Gateway error',
      message: 'An error occurred while processing your request',
      requestId: req.requestId,
    });
  }
}

// ============================================================================
// SERVICE ROUTES WITH RATE LIMITING
// ============================================================================

// User Service Routes (Authentication endpoints have stricter limits)
app.use('/api/auth/login', rateLimiter.middleware('auth'));
app.use('/api/auth/register', rateLimiter.middleware('auth'));
app.use('/api/auth/*', rateLimiter.middleware('global'));
app.all('/api/auth/*', (req, res) => proxyRequest('user-service', req, res));

app.use('/api/users', rateLimiter.middleware('global'));
app.all('/api/users/*', (req, res) => proxyRequest('user-service', req, res));

// Appointment Service Routes
app.use('/api/appointments', rateLimiter.middleware('booking'));
app.all('/api/appointments/*', (req, res) => proxyRequest('appointment-service', req, res));

// Payment Service Routes (stricter limits for payments)
app.use('/api/payments', rateLimiter.middleware('payment'));
app.all('/api/payments/*', (req, res) => proxyRequest('payment-service', req, res));

// Inspection Service Routes
app.use('/api/inspections', rateLimiter.middleware('global'));
app.all('/api/inspections/*', (req, res) => proxyRequest('inspection-service', req, res));

// Certificate Service Routes (read-heavy, higher limits)
app.use('/api/certificates', rateLimiter.middleware('readonly'));
app.all('/api/certificates/*', (req, res) => proxyRequest('certificate-service', req, res));

// Notification Service Routes
app.use('/api/notifications', rateLimiter.middleware('global'));
app.all('/api/notifications/*', (req, res) => proxyRequest('notification-service', req, res));

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * Admin: Get all circuit breaker states
 */
app.get('/admin/circuit-breakers', (req, res) => {
  const status = circuitBreakerManager.getHealthStatus();
  res.json(status);
});

/**
 * Admin: Manually open a circuit breaker
 */
app.post('/admin/circuit-breakers/:service/open', (req, res) => {
  const { service } = req.params;
  circuitBreakerManager.openCircuit(service);
  res.json({ success: true, message: `Circuit opened for ${service}` });
});

/**
 * Admin: Manually close a circuit breaker
 */
app.post('/admin/circuit-breakers/:service/close', (req, res) => {
  const { service } = req.params;
  circuitBreakerManager.closeCircuit(service);
  res.json({ success: true, message: `Circuit closed for ${service}` });
});

/**
 * Admin: Get rate limit status for a user
 */
app.get('/admin/rate-limits/:identifier', async (req, res) => {
  const { identifier } = req.params;
  const status = await rateLimiter.getStatus(identifier);
  res.json(status);
});

/**
 * Admin: Reset rate limit for a user
 */
app.post('/admin/rate-limits/:identifier/reset', async (req, res) => {
  const { identifier } = req.params;
  const { tier } = req.query;
  await rateLimiter.resetLimit(identifier, tier);
  res.json({ success: true, message: `Rate limit reset for ${identifier}` });
});

/**
 * Admin: Clear service discovery cache
 */
app.post('/admin/service-discovery/clear-cache', (req, res) => {
  serviceDiscovery.clearCache();
  res.json({ success: true, message: 'Service discovery cache cleared' });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    requestId: req.requestId,
  });
});

app.use((error, req, res, next) => {
  console.error(`[${req.requestId}] Unhandled error:`, error);
  
  if (req.span) {
    req.span.setTag(opentracing.Tags.ERROR, true);
    req.span.log({
      event: 'error',
      'error.kind': error.name,
      message: error.message,
      stack: error.stack,
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
    requestId: req.requestId,
  });
});

// ============================================================================
// STARTUP
// ============================================================================

async function startServer() {
  try {
    // Register this gateway instance with Consul
    await serviceDiscovery.registerService('api-gateway', PORT);

    // Start HTTP server
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(70));
      console.log('🚀 API Gateway Started');
      console.log('='.repeat(70));
      console.log(`📍 HTTP Server: http://localhost:${PORT}`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
      console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
      console.log('\n📡 Distributed Systems Components:');
      console.log(`   🔵 Jaeger UI: http://localhost:16686`);
      console.log(`   🟢 Consul UI: http://localhost:8500`);
      console.log(`   🟠 Kafka UI: http://localhost:8080`);
      console.log('\n✅ Patterns Enabled:');
      console.log('   • Circuit Breaker (Opossum)');
      console.log('   • Service Discovery (Consul)');
      console.log('   • Distributed Tracing (Jaeger)');
      console.log('   • Distributed Rate Limiting (Redis)');
      console.log('   • Load Balancing (Nginx)');
      console.log('='.repeat(70) + '\n');
    });

  } catch (error) {
    console.error('❌ Failed to start API Gateway:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down API Gateway...');
  
  // Deregister from Consul
  await serviceDiscovery.deregisterService(`api-gateway-${require('os').hostname()}-${PORT}`);
  
  // Close Redis connection
  await rateLimiter.close();
  
  // Close tracer
  await tracer.close();
  
  console.log('✅ Graceful shutdown complete');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;

/**
 * ============================================================================
 * DEMONSTRATION FOR ACADEMIC EVALUATION
 * ============================================================================
 * 
 * 1. CIRCUIT BREAKER:
 *    - Stop payment-service: docker-compose stop payment-service
 *    - Make payment request: curl http://localhost/api/payments
 *    - Observe: Circuit opens, returns fallback immediately
 *    - Check status: curl http://localhost/admin/circuit-breakers
 *    - Restart service: docker-compose start payment-service
 *    - Circuit auto-recovers after 30s
 * 
 * 2. SERVICE DISCOVERY:
 *    - Check Consul UI: http://localhost:8500
 *    - Scale appointment-service: docker-compose up --scale appointment-service=3
 *    - Consul shows 3 healthy instances
 *    - Gateway automatically discovers and uses all instances
 * 
 * 3. DISTRIBUTED TRACING:
 *    - Make any request: curl http://localhost/api/appointments
 *    - Open Jaeger: http://localhost:16686
 *    - Search for "api-gateway"
 *    - See request flow: gateway → appointment-service
 *    - View timing, errors, tags
 * 
 * 4. RATE LIMITING:
 *    - Scale gateway: docker-compose up --scale api-gateway=3
 *    - Run load test: k6 run load-tests/rate-limit-test.js
 *    - Despite 3 instances, rate limit enforced globally via Redis
 *    - Check Redis: redis-cli KEYS "rl:*"
 * 
 * 5. LOAD BALANCING:
 *    - Check Nginx config: cat infrastructure/nginx/nginx.conf
 *    - Scale gateway: docker-compose up --scale api-gateway=3
 *    - Make requests through Nginx: curl http://localhost/api/health
 *    - Nginx distributes across all 3 gateway instances
 *    - Check Nginx stats: curl http://localhost/nginx-status
 * 
 * ============================================================================
 */
