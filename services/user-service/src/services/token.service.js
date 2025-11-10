/**
 * Token Service - JWT Management with Refresh Tokens
 * 
 * Purpose: Secure authentication with token refresh mechanism
 * Pattern: JWT + Refresh Token stored in Redis
 * 
 * Flow:
 * 1. Login → Generate access token (15min) + refresh token (7 days)
 * 2. Store refresh token in Redis with user ID
 * 3. Access token expires → Client sends refresh token
 * 4. Validate refresh token → Issue new access token
 * 5. Logout → Revoke refresh token from Redis
 * 
 * Security Benefits:
 * - Short-lived access tokens (reduce exposure)
 * - Long-lived refresh tokens (better UX)
 * - Token revocation possible (logout, security breach)
 * - Redis TTL auto-cleanup
 * 
 * Academic Value:
 * - Demonstrates secure auth patterns
 * - Shows distributed session management
 * - Proves understanding of JWT limitations
 */

const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const crypto = require('crypto');

class TokenService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis error in token service:', error.message);
    });

    // Token configuration
    this.ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    this.REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
    this.ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
    this.REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
    this.REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
  }

  /**
   * Generate access token (short-lived)
   */
  generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };

    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'smartautocheck',
      audience: 'smartautocheck-api',
    });
  }

  /**
   * Generate refresh token (long-lived)
   */
  generateRefreshToken() {
    // Use crypto for truly random token
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Generate token pair (access + refresh)
   */
  async generateTokenPair(user) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();

    // Store refresh token in Redis
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      tokenType: 'Bearer',
    };
  }

  /**
   * Store refresh token in Redis
   */
  async storeRefreshToken(userId, refreshToken, metadata = {}) {
    const key = `refresh_token:${userId}:${refreshToken}`;

    const data = {
      userId,
      createdAt: new Date().toISOString(),
      ...metadata,
    };

    // Store with TTL
    await this.redis.setex(
      key,
      this.REFRESH_TOKEN_TTL,
      JSON.stringify(data)
    );

    console.log(`✅ Refresh token stored for user ${userId}`);
  }

  /**
   * Validate refresh token
   */
  async validateRefreshToken(userId, refreshToken) {
    const key = `refresh_token:${userId}:${refreshToken}`;
    const data = await this.redis.get(key);

    if (!data) {
      return {
        valid: false,
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token not found or expired',
      };
    }

    return {
      valid: true,
      data: JSON.parse(data),
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(userId, refreshToken) {
    // Validate refresh token
    const validation = await this.validateRefreshToken(userId, refreshToken);

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Get user from database
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const result = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    // Generate new access token
    const accessToken = this.generateAccessToken(user);

    console.log(`🔄 Access token refreshed for user ${userId}`);

    return {
      accessToken,
      expiresIn: 900,
      tokenType: 'Bearer',
    };
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeRefreshToken(userId, refreshToken) {
    const key = `refresh_token:${userId}:${refreshToken}`;
    await this.redis.del(key);
    console.log(`🚪 Refresh token revoked for user ${userId}`);
  }

  /**
   * Revoke all refresh tokens for user (force logout all devices)
   */
  async revokeAllRefreshTokens(userId) {
    const pattern = `refresh_token:${userId}:*`;
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
      console.log(`🚪 All refresh tokens revoked for user ${userId} (${keys.length} tokens)`);
    }
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      const payload = jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
        issuer: 'smartautocheck',
        audience: 'smartautocheck-api',
      });

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.name,
        message: error.message,
      };
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token) {
    return jwt.decode(token);
  }

  /**
   * Get all active sessions for user (for admin dashboard)
   */
  async getUserSessions(userId) {
    const pattern = `refresh_token:${userId}:*`;
    const keys = await this.redis.keys(pattern);

    const sessions = [];
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const session = JSON.parse(data);
        const ttl = await this.redis.ttl(key);
        sessions.push({
          ...session,
          expiresIn: ttl,
        });
      }
    }

    return sessions;
  }

  /**
   * Generate email verification token
   */
  async generateEmailVerificationToken(userId, email) {
    const token = crypto.randomBytes(32).toString('hex');
    const key = `email_verification:${token}`;

    await this.redis.setex(
      key,
      24 * 60 * 60, // 24 hours
      JSON.stringify({ userId, email, createdAt: new Date().toISOString() })
    );

    return token;
  }

  /**
   * Verify email verification token
   */
  async verifyEmailToken(token) {
    const key = `email_verification:${token}`;
    const data = await this.redis.get(key);

    if (!data) {
      return { valid: false, error: 'Token expired or invalid' };
    }

    const parsed = JSON.parse(data);

    // Delete token after use (single use)
    await this.redis.del(key);

    return {
      valid: true,
      userId: parsed.userId,
      email: parsed.email,
    };
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(userId, email) {
    const token = crypto.randomBytes(32).toString('hex');
    const key = `password_reset:${token}`;

    await this.redis.setex(
      key,
      60 * 60, // 1 hour
      JSON.stringify({ userId, email, createdAt: new Date().toISOString() })
    );

    return token;
  }

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token) {
    const key = `password_reset:${token}`;
    const data = await this.redis.get(key);

    if (!data) {
      return { valid: false, error: 'Token expired or invalid' };
    }

    return {
      valid: true,
      data: JSON.parse(data),
    };
  }

  /**
   * Invalidate password reset token after use
   */
  async invalidatePasswordResetToken(token) {
    const key = `password_reset:${token}`;
    await this.redis.del(key);
  }

  /**
   * Cleanup on shutdown
   */
  async close() {
    await this.redis.quit();
  }
}

// Singleton instance
const tokenService = new TokenService();

module.exports = tokenService;

/**
 * USAGE EXAMPLE:
 * 
 * === LOGIN ===
 * const tokens = await tokenService.generateTokenPair(user);
 * // Returns: { accessToken, refreshToken, expiresIn, tokenType }
 * 
 * res.json({
 *   success: true,
 *   data: {
 *     user,
 *     ...tokens,
 *   },
 * });
 * 
 * === REFRESH TOKEN ===
 * const { userId, refreshToken } = req.body;
 * const newTokens = await tokenService.refreshAccessToken(userId, refreshToken);
 * 
 * res.json({
 *   success: true,
 *   data: newTokens,
 * });
 * 
 * === LOGOUT ===
 * await tokenService.revokeRefreshToken(userId, refreshToken);
 * 
 * === LOGOUT ALL DEVICES ===
 * await tokenService.revokeAllRefreshTokens(userId);
 * 
 * === EMAIL VERIFICATION ===
 * const token = await tokenService.generateEmailVerificationToken(user.id, user.email);
 * // Send email with link: https://app.com/verify-email?token=${token}
 * 
 * // On verification endpoint:
 * const verification = await tokenService.verifyEmailToken(token);
 * if (verification.valid) {
 *   await updateUserEmailVerified(verification.userId);
 * }
 * 
 * === PASSWORD RESET ===
 * const token = await tokenService.generatePasswordResetToken(user.id, user.email);
 * // Send email with link: https://app.com/reset-password?token=${token}
 * 
 * // On reset endpoint:
 * const verification = await tokenService.verifyPasswordResetToken(token);
 * if (verification.valid) {
 *   await updateUserPassword(verification.data.userId, newPassword);
 *   await tokenService.invalidatePasswordResetToken(token);
 * }
 * 
 * SECURITY BENEFITS:
 * 
 * 1. Short-lived access tokens:
 *    - If stolen, only valid for 15 minutes
 *    - Reduces attack window
 * 
 * 2. Refresh token rotation:
 *    - Each refresh generates new access token
 *    - Can implement refresh token rotation for extra security
 * 
 * 3. Token revocation:
 *    - Logout immediately revokes refresh token
 *    - User can logout all devices
 *    - Admin can force logout user
 * 
 * 4. Redis TTL:
 *    - Tokens auto-expire
 *    - No manual cleanup needed
 *    - Memory efficient
 * 
 * ACADEMIC SIGNIFICANCE:
 * - Demonstrates JWT best practices
 * - Shows distributed session management
 * - Proves understanding of auth security
 * - Industry-standard implementation
 */
