const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const appointmentRoutes = require('./routes/appointment.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { initKafka, kafkaService } = require('./config/kafka');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'appointment-service', 
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/appointments', appointmentRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Initialize Kafka and start server
(async () => {
  try {
    await initKafka();
    
    app.listen(PORT, () => {
      console.log(`Appointment Service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (kafkaService) {
    await kafkaService.disconnect();
  }
  process.exit(0);
});

module.exports = app;
