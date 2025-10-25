const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const invoiceRoutes = require('./routes/invoice.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { initKafka, startConsumer } = require('./config/kafka');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'invoice-service', timestamp: new Date().toISOString() });
});

app.use('/api/invoices', invoiceRoutes);
app.use(errorHandler);

(async () => {
  try {
    await initKafka();
    await startConsumer(); // Listen for payment.completed events
    app.listen(PORT, () => console.log(`Invoice Service running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
})();

module.exports = app;
