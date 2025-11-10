const promClient = require('prom-client');

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

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

const inspectionsTotal = new promClient.Counter({
  name: 'inspections_total',
  help: 'Total number of inspections',
  labelNames: ['status', 'result']
});

const certificatesGenerated = new promClient.Counter({
  name: 'certificates_generated_total',
  help: 'Total number of certificates generated',
  labelNames: ['status']
});

const kafkaMessagesReceived = new promClient.Counter({
  name: 'kafka_messages_received_total',
  help: 'Total number of Kafka messages received',
  labelNames: ['topic', 'status']
});

const kafkaMessagesSent = new promClient.Counter({
  name: 'kafka_messages_sent_total',
  help: 'Total number of Kafka messages sent',
  labelNames: ['topic', 'status']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(inspectionsTotal);
register.registerMetric(certificatesGenerated);
register.registerMetric(kafkaMessagesReceived);
register.registerMetric(kafkaMessagesSent);

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
    inspectionsTotal,
    certificatesGenerated,
    kafkaMessagesReceived,
    kafkaMessagesSent
  }
};
