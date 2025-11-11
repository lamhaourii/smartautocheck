const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: () => null, // Don't retry if Redis is not available
  lazyConnect: true
});

redisClient.on('connect', () => {
  console.log('✅ Redis client connected');
});

redisClient.on('error', (err) => {
  console.log('⚠️  Redis not available (optional):', err.message);
});

// Try to connect but don't fail if Redis is not available
redisClient.connect().catch(err => {
  console.log('⚠️  Redis connection skipped (optional service)');
});

module.exports = redisClient;
