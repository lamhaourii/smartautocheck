/**
 * Distributed Rate Limiter with Redis
 * Pattern: Distributed Rate Limiting
 * Purpose: Fair API usage across multiple gateway instances
 * 
 * Why Redis instead of in-memory?
 * - In-memory limiters work per instance (each gateway has separate counters)
 * - Redis provides shared state across all gateway instances
 * - When scaling to 3 gateways, rate limit is enforced globally
 * 
 * Benefits:
 * - Prevents API abuse
 * - Fair resource allocation
 * - Works across horizontal scaling
 * - Protects backend services from overload
 * 
 * Academic Value:
 * - Demonstrates understanding of distributed state management
 * - Shows why shared cache is needed in microservices
 * - Proves horizontal scaling doesn't break rate limiting
 */

const Redis = require('ioredis');
const { RateLimiterRedis } = require('rate-limiter-flexible');

class DistributedRateLimiter {
  constructor() {
    // Connect to Redis
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('❌ Redis connection failed, rate limiter disabled');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis connected for distributed rate limiting');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis error:', error.message);
    });

    // Rate limiter configurations
    this.limiters = {};
    this.initializeLimiters();
  }

  /**
   * Initialize rate limiters for different tiers
   * Different endpoints may have different limits
   */
  initializeLimiters() {
    // Global API rate limit (applies to all endpoints)
    this.limiters.global = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl:global',
      points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests
      duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 60, // per 60 seconds
      blockDuration: 60, // Block for 60 seconds if exceeded
    });

    // Auth endpoints (login, register) - stricter limits
    this.limiters.auth = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl:auth',
      points: 5, // 5 attempts
      duration: 60, // per minute
      blockDuration: 300, // Block for 5 minutes if exceeded
    });

    // Payment endpoints - moderate limits
    this.limiters.payment = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl:payment',
      points: 10, // 10 payments
      duration: 60, // per minute
      blockDuration: 120, // Block for 2 minutes
    });

    // Booking endpoints - generous limits
    this.limiters.booking = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl:booking',
      points: 20, // 20 bookings
      duration: 60, // per minute
      blockDuration: 60,
    });

    // Read-only endpoints (GET) - higher limits
    this.limiters.readonly = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'rl:readonly',
      points: 200, // 200 requests
      duration: 60, // per minute
      blockDuration: 30,
    });

    console.log('✅ Distributed rate limiters initialized');
  }

  /**
   * Express middleware for rate limiting
   * 
   * @param {string} tier - Limiter tier: 'global', 'auth', 'payment', 'booking', 'readonly'
   */
  middleware(tier = 'global') {
    return async (req, res, next) => {
      // Identify user by IP or JWT token
      const key = this.getIdentifier(req);
      const limiter = this.limiters[tier] || this.limiters.global;

      try {
        // Consume 1 point for this request
        const rateLimiterRes = await limiter.consume(key);

        // Add rate limit headers to response
        res.set({
          'X-RateLimit-Limit': limiter.points,
          'X-RateLimit-Remaining': rateLimiterRes.remainingPoints,
          'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString(),
        });

        next();
      } catch (rateLimiterRes) {
        // Rate limit exceeded
        console.warn(`⚠️ Rate limit exceeded for ${key} on ${tier} tier`);

        res.set({
          'X-RateLimit-Limit': limiter.points,
          'X-RateLimit-Remaining': 0,
          'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString(),
          'Retry-After': Math.ceil(rateLimiterRes.msBeforeNext / 1000),
        });

        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${Math.ceil(rateLimiterRes.msBeforeNext / 1000)} seconds.`,
          retryAfter: Math.ceil(rateLimiterRes.msBeforeNext / 1000),
        });
      }
    };
  }

  /**
   * Get unique identifier for rate limiting
   * Priority: User ID > JWT Token > IP Address
   */
  getIdentifier(req) {
    // If authenticated, use user ID for per-user limits
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }

    // If JWT present but not decoded, use token hash
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return `token:${this.hashToken(token)}`;
    }

    // Fall back to IP address
    const ip = req.ip || req.connection.remoteAddress;
    return `ip:${ip}`;
  }

  /**
   * Hash token for rate limiting key
   * Avoid storing full JWT in Redis
   */
  hashToken(token) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
  }

  /**
   * Get rate limit status for a user
   * Useful for admin dashboard
   */
  async getStatus(identifier) {
    try {
      const status = {};
      
      for (const [tier, limiter] of Object.entries(this.limiters)) {
        const key = `${limiter.keyPrefix}:${identifier}`;
        const remaining = await this.redis.get(key);
        
        status[tier] = {
          limit: limiter.points,
          remaining: remaining ? limiter.points - parseInt(remaining) : limiter.points,
          blocked: remaining && parseInt(remaining) >= limiter.points,
        };
      }

      return status;
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return null;
    }
  }

  /**
   * Manually reset rate limit for a user (admin action)
   */
  async resetLimit(identifier, tier = 'global') {
    try {
      const limiter = this.limiters[tier];
      const key = `${limiter.keyPrefix}:${identifier}`;
      await this.redis.del(key);
      console.log(`✅ Rate limit reset for ${identifier} on ${tier} tier`);
      return true;
    } catch (error) {
      console.error('Error resetting rate limit:', error);
      return false;
    }
  }

  /**
   * Get all rate limit statistics
   * For monitoring dashboard
   */
  async getStatistics() {
    try {
      const stats = {};
      
      for (const [tier, limiter] of Object.entries(this.limiters)) {
        const pattern = `${limiter.keyPrefix}:*`;
        const keys = await this.redis.keys(pattern);
        
        stats[tier] = {
          activeUsers: keys.length,
          limit: limiter.points,
          duration: limiter.duration,
        };
      }

      return stats;
    } catch (error) {
      console.error('Error getting rate limit statistics:', error);
      return null;
    }
  }

  /**
   * Cleanup on shutdown
   */
  async close() {
    await this.redis.quit();
    console.log('✅ Redis connection closed');
  }
}

// Singleton instance
const rateLimiter = new DistributedRateLimiter();

module.exports = rateLimiter;

/**
 * DEMONSTRATION: Why Distributed Rate Limiting Matters
 * 
 * Scenario 1: In-Memory Rate Limiter (WRONG)
 * ==========================================
 * - Deploy 3 API Gateway instances
 * - Each has its own in-memory counter
 * - User makes 100 req/min through load balancer
 * - Nginx distributes: 33 req to Gateway1, 33 to Gateway2, 34 to Gateway3
 * - Each gateway sees < 100 req/min
 * - Result: Rate limit NOT enforced (user made 100 requests, limit is 100)
 * 
 * Scenario 2: Redis-Based Rate Limiter (CORRECT)
 * ===============================================
 * - Deploy 3 API Gateway instances
 * - All share same Redis counter
 * - User makes 100 req/min through load balancer
 * - Redis counter increments to 100 across all instances
 * - 101st request blocked regardless of which gateway receives it
 * - Result: Rate limit correctly enforced
 * 
 * TESTING:
 * 1. Start system: docker-compose up
 * 2. Scale gateway: docker-compose up --scale api-gateway=3
 * 3. Load test: k6 run load-tests/rate-limit-test.js
 * 4. Verify: Exactly 100 requests succeed, rest get 429
 * 5. Check Redis: redis-cli KEYS "rl:*" shows single counter
 */
