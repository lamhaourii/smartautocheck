const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const kafkaMessagesSent = new promClient.Counter({
  name: 'kafka_messages_sent_total',
  help: 'Total number of Kafka messages sent',
  labelNames: ['topic', 'status']
});

const paymentTransactions = new promClient.Counter({
  name: 'payment_transactions_total',
  help: 'Total number of payment transactions',
  labelNames: ['status', 'payment_method']
});

const invoicesGenerated = new promClient.Counter({
  name: 'invoices_generated_total',
  help: 'Total number of invoices generated',
  labelNames: ['status']
});

const dbConnectionPool = new promClient.Gauge({
  name: 'db_connection_pool_size',
  help: 'Database connection pool size',
  labelNames: ['state']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(kafkaMessagesSent);
register.registerMetric(paymentTransactions);
register.registerMetric(invoicesGenerated);
register.registerMetric(dbConnectionPool);

// Middleware to track request metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });

  next();
};

// Metrics endpoint
const metricsEndpoint = async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

module.exports = {
  register,
  metricsMiddleware,
  metricsEndpoint,
  metrics: {
    httpRequestDuration,
    httpRequestTotal,
    kafkaMessagesSent,
    paymentTransactions,
    invoicesGenerated,
    dbConnectionPool
  }
};
