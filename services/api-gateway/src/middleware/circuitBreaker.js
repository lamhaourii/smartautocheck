const CircuitBreaker = require('opossum');
const axios = require('axios');

/**
 * Circuit breaker configuration for downstream services
 */
const breakerOptions = {
  timeout: 5000, // 5 seconds
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: 30000, // Try again after 30 seconds
  rollingCountTimeout: 10000, // Rolling window for error calculation
  rollingCountBuckets: 10,
  name: 'service-breaker',
  volumeThreshold: 5 // Minimum requests before circuit can open
};

/**
 * Create circuit breaker for a service
 */
function createServiceBreaker(serviceName, serviceUrl) {
  const breaker = new CircuitBreaker(
    async (path, options = {}) => {
      const url = `${serviceUrl}${path}`;
      const response = await axios({
        url,
        method: options.method || 'GET',
        data: options.data,
        headers: options.headers,
        timeout: breakerOptions.timeout
      });
      return response.data;
    },
    {
      ...breakerOptions,
      name: `${serviceName}-breaker`
    }
  );

  // Event listeners for monitoring
  breaker.on('open', () => {
    console.error(`Circuit breaker opened for ${serviceName}`);
  });

  breaker.on('halfOpen', () => {
    console.warn(`Circuit breaker half-open for ${serviceName}`);
  });

  breaker.on('close', () => {
    console.info(`Circuit breaker closed for ${serviceName}`);
  });

  breaker.on('failure', (error) => {
    console.error(`Request failed for ${serviceName}:`, error.message);
  });

  breaker.on('timeout', () => {
    console.error(`Request timeout for ${serviceName}`);
  });

  breaker.on('fallback', (result) => {
    console.warn(`Fallback triggered for ${serviceName}`);
  });

  return breaker;
}

/**
 * Circuit breakers for all downstream services
 */
const breakers = {
  userService: createServiceBreaker(
    'user-service',
    process.env.USER_SERVICE_URL || 'http://user-service:3001'
  ),
  appointmentService: createServiceBreaker(
    'appointment-service',
    process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3002'
  ),
  paymentInvoiceService: createServiceBreaker(
    'payment-invoice-service',
    process.env.PAYMENT_INVOICE_SERVICE_URL || 'http://payment-invoice-service:3004'
  ),
  inspectionCertificationService: createServiceBreaker(
    'inspection-certification-service',
    process.env.INSPECTION_CERTIFICATION_SERVICE_URL || 'http://inspection-certification-service:3005'
  )
};

/**
 * Fallback responses for when circuit is open
 */
const fallbackResponses = {
  userService: {
    success: false,
    message: 'User service is temporarily unavailable',
    code: 'SERVICE_UNAVAILABLE'
  },
  appointmentService: {
    success: false,
    message: 'Appointment service is temporarily unavailable',
    code: 'SERVICE_UNAVAILABLE'
  },
  paymentInvoiceService: {
    success: false,
    message: 'Payment service is temporarily unavailable',
    code: 'SERVICE_UNAVAILABLE'
  },
  inspectionCertificationService: {
    success: false,
    message: 'Inspection service is temporarily unavailable',
    code: 'SERVICE_UNAVAILABLE'
  }
};

/**
 * Circuit breaker middleware
 */
const circuitBreakerMiddleware = (serviceName) => {
  return async (req, res, next) => {
    const breaker = breakers[serviceName];
    
    if (!breaker) {
      return res.status(500).json({
        success: false,
        message: 'Invalid service configuration'
      });
    }

    // Attach breaker to request for use in routes
    req.breaker = breaker;
    req.serviceName = serviceName;
    req.fallbackResponse = fallbackResponses[serviceName];

    next();
  };
};

/**
 * Get circuit breaker stats for all services
 */
function getBreakerStats() {
  const stats = {};
  
  for (const [name, breaker] of Object.entries(breakers)) {
    stats[name] = {
      state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
      stats: breaker.stats,
      options: {
        timeout: breaker.options.timeout,
        errorThreshold: breaker.options.errorThresholdPercentage,
        resetTimeout: breaker.options.resetTimeout
      }
    };
  }
  
  return stats;
}

module.exports = {
  circuitBreakerMiddleware,
  breakers,
  getBreakerStats
};
