const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const certificateRoutes = require('./routes/certificate.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { initKafka, startConsumer } = require('./config/kafka');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'certificate-service', timestamp: new Date().toISOString() });
});

app.use('/api/certificates', certificateRoutes);
app.use(errorHandler);

(async () => {
  try {
    await initKafka();
    await startConsumer(); // Listen for inspection.completed events
    app.listen(PORT, () => console.log(`Certificate Service running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
})();

module.exports = app;
