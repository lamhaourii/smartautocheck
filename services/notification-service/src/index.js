const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const notificationRoutes = require('./routes/notification.routes');
const { errorHandler } = require('./middleware/error.middleware');
const { startConsumer } = require('./config/kafka');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-service', timestamp: new Date().toISOString() });
});

app.use('/api/notifications', notificationRoutes);
app.use(errorHandler);

(async () => {
  try {
    await startConsumer();
    app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
})();

module.exports = app;
