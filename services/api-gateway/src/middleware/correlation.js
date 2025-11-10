const { v4: uuidv4 } = require('uuid');

/**
 * Correlation ID middleware
 * Generates or extracts correlation ID for request tracking across services
 */
const correlationMiddleware = (req, res, next) => {
  // Check if correlation ID exists in headers
  const correlationId = req.headers['x-correlation-id'] || 
                       req.headers['x-request-id'] || 
                       uuidv4();

  // Attach to request object
  req.correlationId = correlationId;

  // Add to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  // Log request with correlation ID
  req.startTime = Date.now();
  
  // Override end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - req.startTime;
    console.log({
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = { correlationMiddleware };
