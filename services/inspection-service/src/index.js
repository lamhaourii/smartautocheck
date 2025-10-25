const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const inspectionRoutes = require('./routes/inspection.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { initKafka } = require('./config/kafka');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'inspection-service', timestamp: new Date().toISOString() });
});

app.use('/api/inspections', inspectionRoutes);
app.use(errorHandler);

(async () => {
  try {
    await initKafka();
    app.listen(PORT, () => console.log(`Inspection Service running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
})();

module.exports = app;
