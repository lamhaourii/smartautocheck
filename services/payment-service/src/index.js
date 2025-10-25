const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const paymentRoutes = require('./routes/payment.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { initKafka, kafkaService } = require('./config/kafka');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'payment-service', timestamp: new Date().toISOString() });
});

app.use('/api/payments', paymentRoutes);
app.use(errorHandler);

(async () => {
  try {
    await initKafka();
    app.listen(PORT, () => console.log(`Payment Service running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
})();

process.on('SIGTERM', async () => {
  if (kafkaService) await kafkaService.disconnect();
  process.exit(0);
});

module.exports = app;
