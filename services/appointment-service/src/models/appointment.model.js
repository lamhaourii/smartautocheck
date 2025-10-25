const db = require('../config/database');

class AppointmentModel {
  static async create(appointmentData) {
    const { userId, vehicleId, scheduledDate, serviceType, notes } = appointmentData;
    
    const query = `
      INSERT INTO appointments (user_id, vehicle_id, scheduled_date, service_type, notes, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `;
    
    const result = await db.query(query, [userId, vehicleId, scheduledDate, serviceType, notes]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT a.*, 
             u.email as user_email, u.first_name, u.last_name,
             v.registration_number, v.make, v.model, v.year
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      WHERE a.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const query = `
      SELECT a.*,
             v.registration_number, v.make, v.model, v.year
      FROM appointments a
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      WHERE a.user_id = $1
      ORDER BY a.scheduled_date DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async update(id, updates) {
    const allowedFields = ['scheduled_date', 'status', 'notes', 'service_type'];
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
      UPDATE appointments 
      SET ${setClause.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM appointments WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async checkAvailability(date) {
    const query = `
      SELECT COUNT(*) as count
      FROM appointments
      WHERE DATE(scheduled_date) = DATE($1)
      AND status NOT IN ('cancelled', 'completed')
    `;
    const result = await db.query(query, [date]);
    return parseInt(result.rows[0].count);
  }

  static async findAll(filters = {}, limit = 50, offset = 0) {
    let query = `
      SELECT a.*,
             u.email as user_email, u.first_name, u.last_name,
             v.registration_number, v.make, v.model
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN vehicles v ON a.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND a.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.startDate) {
      query += ` AND a.scheduled_date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND a.scheduled_date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    query += ` ORDER BY a.scheduled_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  static async count(filters = {}) {
    let query = 'SELECT COUNT(*) FROM appointments WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.userId) {
      query += ` AND user_id = $${paramCount}`;
      params.push(filters.userId);
      paramCount++;
    }

    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }
}

module.exports = AppointmentModel;
