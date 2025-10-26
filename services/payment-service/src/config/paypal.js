const paypal = require('@paypal/checkout-server-sdk');

// PayPal environment setup
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE || 'sandbox'; // sandbox or live

  if (!clientId || !clientSecret) {
    console.warn('PayPal credentials not found. Using mock mode.');
    return null;
  }

  // Use sandbox or production environment
  if (mode === 'live') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  } else {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }
}

// PayPal HTTP client
function client() {
  const env = environment();
  if (!env) {
    return null;
  }
  return new paypal.core.PayPalHttpClient(env);
}

module.exports = { client, environment };
