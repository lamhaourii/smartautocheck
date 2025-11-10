const db = require('../config/database');

class UserModel {
  static async create(userData) {
    const { email, passwordHash, firstName, lastName, phone, role = 'customer' } = userData;
    
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, phone, role, created_at
    `;
    
    const result = await db.query(query, [email, passwordHash, firstName, lastName, phone, role]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, email, first_name, last_name, phone, role, created_at FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, updates) {
    const allowedFields = ['first_name', 'last_name', 'phone'];
    const setClause = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `
      UPDATE users 
      SET ${setClause.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, phone, role, updated_at
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findAll(limit = 50, offset = 0) {
    const query = `
      SELECT id, email, first_name, last_name, phone, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    const result = await db.query(query, [limit, offset]);
    return result.rows;
  }

  static async count() {
    const query = 'SELECT COUNT(*) FROM users';
    const result = await db.query(query);
    return parseInt(result.rows[0].count);
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Refresh token methods
  static async createRefreshToken(userId, token, expiresAt) {
    const query = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const result = await db.query(query, [userId, token, expiresAt]);
    return result.rows[0];
  }

  static async findRefreshToken(token) {
    const query = 'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()';
    const result = await db.query(query, [token]);
    return result.rows[0];
  }

  static async revokeRefreshToken(token) {
    const query = 'UPDATE refresh_tokens SET is_revoked = TRUE WHERE token = $1';
    await db.query(query, [token]);
  }

  static async cleanupExpiredTokens() {
    const query = 'DELETE FROM refresh_tokens WHERE expires_at < NOW()';
    await db.query(query);
  }

  // Password reset methods
  static async createPasswordResetToken(userId, tokenHash, expiresAt) {
    const query = `
      UPDATE users 
      SET reset_password_token = $1, reset_password_expires = $2
      WHERE id = $3
    `;
    await db.query(query, [tokenHash, expiresAt, userId]);
  }

  static async findByPasswordResetToken(tokenHash) {
    const query = `
      SELECT * FROM users 
      WHERE reset_password_token = $1 
      AND reset_password_expires > NOW()
    `;
    const result = await db.query(query, [tokenHash]);
    return result.rows[0];
  }

  static async updatePassword(userId, passwordHash) {
    const query = 'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2';
    await db.query(query, [passwordHash, userId]);
  }

  static async clearPasswordResetToken(userId) {
    const query = `
      UPDATE users 
      SET reset_password_token = NULL, reset_password_expires = NULL
      WHERE id = $1
    `;
    await db.query(query, [userId]);
  }

  // Preferences
  static async updatePreferences(userId, preferences) {
    const query = 'UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2';
    await db.query(query, [JSON.stringify(preferences), userId]);
  }

  // Last login
  static async updateLastLogin(userId) {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = $1';
    await db.query(query, [userId]);
  }
}

module.exports = UserModel;
