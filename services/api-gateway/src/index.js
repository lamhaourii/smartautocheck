const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'api-gateway', 
    timestamp: new Date().toISOString() 
  });
});

// Service endpoints
const services = {
  user: process.env.USER_SERVICE_URL || 'http://user-service:3000',
  appointment: process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3000',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3000',
  document: process.env.DOCUMENT_SERVICE_URL || 'http://document-service:3000',
  inspection: process.env.INSPECTION_SERVICE_URL || 'http://inspection-service:3000',
  certificate: process.env.CERTIFICATE_SERVICE_URL || 'http://certificate-service:3000',
  invoice: process.env.INVOICE_SERVICE_URL || 'http://invoice-service:3000',
  chatbot: process.env.CHATBOT_SERVICE_URL || 'http://chatbot-service:3000',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3000'
};

// Proxy options
const proxyOptions = {
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({
      success: false,
      message: 'Service unavailable',
      error: err.message
    });
  }
};

// Route definitions
app.use('/api/auth', createProxyMiddleware({ ...proxyOptions, target: services.user }));
app.use('/api/users', createProxyMiddleware({ ...proxyOptions, target: services.user }));
app.use('/api/appointments', createProxyMiddleware({ ...proxyOptions, target: services.appointment }));
app.use('/api/payments', createProxyMiddleware({ ...proxyOptions, target: services.payment }));
app.use('/api/documents', createProxyMiddleware({ ...proxyOptions, target: services.document }));
app.use('/api/inspections', createProxyMiddleware({ ...proxyOptions, target: services.inspection }));
app.use('/api/certificates', createProxyMiddleware({ ...proxyOptions, target: services.certificate }));
app.use('/api/invoices', createProxyMiddleware({ ...proxyOptions, target: services.invoice }));
app.use('/api/chatbot', createProxyMiddleware({ ...proxyOptions, target: services.chatbot }));
app.use('/api/notifications', createProxyMiddleware({ ...proxyOptions, target: services.notification }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal gateway error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Service routes configured:');
  Object.entries(services).forEach(([name, url]) => {
    console.log(`  - ${name}: ${url}`);
  });
});

module.exports = app;
