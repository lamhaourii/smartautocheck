const paypal = require('@paypal/checkout-server-sdk');
const CircuitBreaker = require('opossum');
const { logger } = require('./logger');

// PayPal environment setup
const environment = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE || 'sandbox';

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  return mode === 'production'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
};

const paypalClient = () => new paypal.core.PayPalHttpClient(environment());

// Circuit breaker configuration
const circuitBreakerOptions = {
  timeout: 5000, // 5 seconds
  errorThresholdPercentage: 50,
  resetTimeout: 30000, // 30 seconds
  rollingCountTimeout: 10000,
  rollingCountBuckets: 10,
  name: 'paypal-api'
};

// Create order function with circuit breaker
const createOrderFunction = async (orderData) => {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody(orderData);

  const client = paypalClient();
  const response = await client.execute(request);
  
  return response.result;
};

const createOrderBreaker = new CircuitBreaker(createOrderFunction, circuitBreakerOptions);

// Capture order function with circuit breaker
const captureOrderFunction = async (orderId) => {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  const client = paypalClient();
  const response = await client.execute(request);
  
  return response.result;
};

const captureOrderBreaker = new CircuitBreaker(captureOrderFunction, circuitBreakerOptions);

// Refund capture function
const refundCaptureFunction = async (captureId, amount) => {
  const request = new paypal.payments.CapturesRefundRequest(captureId);
  request.requestBody({
    amount: {
      value: amount.toString(),
      currency_code: 'USD'
    }
  });

  const client = paypalClient();
  const response = await client.execute(request);
  
  return response.result;
};

const refundCaptureBreaker = new CircuitBreaker(refundCaptureFunction, circuitBreakerOptions);

// Circuit breaker event listeners
[createOrderBreaker, captureOrderBreaker, refundCaptureBreaker].forEach(breaker => {
  breaker.on('open', () => {
    logger.warn(`Circuit breaker opened for ${breaker.name}`);
  });

  breaker.on('halfOpen', () => {
    logger.info(`Circuit breaker half-open for ${breaker.name}`);
  });

  breaker.on('close', () => {
    logger.info(`Circuit breaker closed for ${breaker.name}`);
  });

  breaker.fallback(() => {
    throw new Error('PayPal service temporarily unavailable. Please try again later.');
  });
});

// Get circuit breaker stats for monitoring
const getCircuitBreakerStats = () => ({
  createOrder: {
    state: createOrderBreaker.opened ? 'open' : 'closed',
    stats: createOrderBreaker.stats
  },
  captureOrder: {
    state: captureOrderBreaker.opened ? 'open' : 'closed',
    stats: captureOrderBreaker.stats
  },
  refund: {
    state: refundCaptureBreaker.opened ? 'open' : 'closed',
    stats: refundCaptureBreaker.stats
  }
});

module.exports = {
  paypalClient,
  createOrderBreaker,
  captureOrderBreaker,
  refundCaptureBreaker,
  getCircuitBreakerStats
};
