/**
 * Distributed Tracing Configuration - Jaeger Integration
 * Pattern: Distributed Tracing across microservices
 * Purpose: Track requests as they flow through multiple services
 * 
 * Benefits:
 * - Identify performance bottlenecks across service boundaries
 * - Debug complex failure scenarios in distributed systems
 * - Visualize service dependencies and call chains
 * - Measure end-to-end latency
 */

const { initTracer } = require('jaeger-client');
const opentracing = require('opentracing');

function initializeTracer(serviceName) {
  const config = {
    serviceName: serviceName || process.env.JAEGER_SERVICE_NAME || 'api-gateway',
    sampler: {
      type: 'const',
      param: 1, // Sample 100% of traces (reduce in production)
    },
    reporter: {
      logSpans: true,
      agentHost: process.env.JAEGER_AGENT_HOST || 'jaeger',
      agentPort: parseInt(process.env.JAEGER_AGENT_PORT || '6831'),
      collectorEndpoint: process.env.JAEGER_COLLECTOR_ENDPOINT,
    },
  };

  const options = {
    logger: {
      info: (msg) => console.log('[Jaeger] INFO:', msg),
      error: (msg) => console.error('[Jaeger] ERROR:', msg),
    },
    tags: {
      'smartautocheck.version': '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  };

  const tracer = initTracer(config, options);
  
  // Set as global tracer
  opentracing.initGlobalTracer(tracer);

  console.log(`✅ Distributed Tracing initialized for ${config.serviceName}`);
  console.log(`📊 Jaeger UI: http://localhost:16686`);

  return tracer;
}

/**
 * Middleware to trace HTTP requests
 * Creates a new span for each incoming request
 */
function tracingMiddleware(tracer) {
  return (req, res, next) => {
    const wireCtx = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, req.headers);
    const span = tracer.startSpan(`${req.method} ${req.path}`, {
      childOf: wireCtx,
      tags: {
        [opentracing.Tags.SPAN_KIND]: opentracing.Tags.SPAN_KIND_RPC_SERVER,
        [opentracing.Tags.HTTP_METHOD]: req.method,
        [opentracing.Tags.HTTP_URL]: req.url,
        [opentracing.Tags.COMPONENT]: 'api-gateway',
      },
    });

    // Inject span context into headers for downstream services
    tracer.inject(span, opentracing.FORMAT_HTTP_HEADERS, req.headers);

    // Store span in request for use in route handlers
    req.span = span;

    // End span when response finishes
    res.on('finish', () => {
      span.setTag(opentracing.Tags.HTTP_STATUS_CODE, res.statusCode);
      if (res.statusCode >= 400) {
        span.setTag(opentracing.Tags.ERROR, true);
        span.log({
          event: 'error',
          'error.kind': 'HTTP_ERROR',
          message: `HTTP ${res.statusCode}`,
        });
      }
      span.finish();
    });

    next();
  };
}

/**
 * Create a child span for tracing service calls
 */
function traceServiceCall(parentSpan, serviceName, operation) {
  const tracer = opentracing.globalTracer();
  return tracer.startSpan(`call-${serviceName}`, {
    childOf: parentSpan,
    tags: {
      [opentracing.Tags.SPAN_KIND]: opentracing.Tags.SPAN_KIND_RPC_CLIENT,
      [opentracing.Tags.COMPONENT]: 'api-gateway',
      service: serviceName,
      operation: operation,
    },
  });
}

module.exports = {
  initializeTracer,
  tracingMiddleware,
  traceServiceCall,
  opentracing,
};
