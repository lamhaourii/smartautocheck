const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const documentRoutes = require('./routes/document.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { connectDB } = require('./config/database');
const { initKafka } = require('./config/kafka');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'document-service', timestamp: new Date().toISOString() });
});

app.use('/api/documents', documentRoutes);
app.use(errorHandler);

(async () => {
  try {
    await connectDB();
    await initKafka();
    app.listen(PORT, () => console.log(`Document Service running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
})();

module.exports = app;
