const { v4: uuidv4 } = require('uuid');
const { dbPool } = require('../config/database');
const { publishEvent } = require('../config/kafka');
const { logger } = require('../config/logger');
const { metrics } = require('../middleware/metrics');
const { NotFoundError, ConflictError, ValidationError } = require('../middleware/errorHandler');
const certificateService = require('./certificate.service');

class InspectionService {
  /**
   * Start a new inspection
   */
  async startInspection(appointmentId, inspectorId, correlationId) {
    try {
      // Verify appointment exists and is paid
      const appointmentResult = await dbPool.query(
        'SELECT id, user_id, status, payment_status FROM appointments WHERE id = $1',
        [appointmentId]
      );

      if (appointmentResult.rows.length === 0) {
        throw new NotFoundError('Appointment not found');
      }

      const appointment = appointmentResult.rows[0];

      if (appointment.payment_status !== 'paid') {
        throw new ValidationError('Appointment must be paid before inspection can start');
      }

      if (appointment.status === 'completed') {
        throw new ConflictError('Inspection already completed');
      }

      // Check if inspection already exists
      const existingInspection = await dbPool.query(
        'SELECT id FROM inspections WHERE appointment_id = $1',
        [appointmentId]
      );

      if (existingInspection.rows.length > 0) {
        throw new ConflictError('Inspection already exists for this appointment');
      }

      // Create inspection record
      const inspectionId = uuidv4();
      await dbPool.query(
        `INSERT INTO inspections 
        (id, appointment_id, inspector_id, status, started_at, created_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [inspectionId, appointmentId, inspectorId, 'in_progress']
      );

      // Update appointment status
      await dbPool.query(
        'UPDATE appointments SET status = $1, inspector_id = $2 WHERE id = $3',
        ['in_progress', inspectorId, appointmentId]
      );

      metrics.inspectionsTotal.inc({ status: 'started', result: 'pending' });

      logger.info('Inspection started', {
        correlationId,
        inspectionId,
        appointmentId,
        inspectorId
      });

      return { inspectionId, status: 'in_progress', startedAt: new Date().toISOString() };
    } catch (error) {
      logger.error('Failed to start inspection', { correlationId, error: error.message });
      throw error;
    }
  }

  /**
   * Update inspection checkpoint
   */
  async updateCheckpoint(inspectionId, checkpointData, correlationId) {
    const { checkpointName, status, notes, photoUrl } = checkpointData;

    try {
      // Verify inspection exists and is in progress
      const inspectionResult = await dbPool.query(
        'SELECT id, status FROM inspections WHERE id = $1',
        [inspectionId]
      );

      if (inspectionResult.rows.length === 0) {
        throw new NotFoundError('Inspection not found');
      }

      const inspection = inspectionResult.rows[0];

      if (inspection.status === 'completed') {
        throw new ConflictError('Cannot update completed inspection');
      }

      // Check if checkpoint already exists
      const existingCheckpoint = await dbPool.query(
        'SELECT id FROM inspection_checkpoints WHERE inspection_id = $1 AND checkpoint_name = $2',
        [inspectionId, checkpointName]
      );

      if (existingCheckpoint.rows.length > 0) {
        // Update existing checkpoint
        await dbPool.query(
          `UPDATE inspection_checkpoints 
          SET status = $1, notes = $2, photo_url = $3, updated_at = NOW()
          WHERE inspection_id = $4 AND checkpoint_name = $5`,
          [status, notes, photoUrl, inspectionId, checkpointName]
        );
      } else {
        // Create new checkpoint
        const checkpointId = uuidv4();
        await dbPool.query(
          `INSERT INTO inspection_checkpoints 
          (id, inspection_id, checkpoint_name, status, notes, photo_url, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [checkpointId, inspectionId, checkpointName, status, notes, photoUrl]
        );
      }

      logger.info('Checkpoint updated', {
        correlationId,
        inspectionId,
        checkpointName,
        status
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to update checkpoint', { correlationId, error: error.message });
      throw error;
    }
  }

  /**
   * Complete inspection and calculate result
   */
  async completeInspection(inspectionId, inspectorId, correlationId) {
    const client = await dbPool.connect();

    try {
      await client.query('BEGIN');

      // Get inspection details
      const inspectionResult = await client.query(
        'SELECT id, appointment_id, inspector_id, status FROM inspections WHERE id = $1',
        [inspectionId]
      );

      if (inspectionResult.rows.length === 0) {
        throw new NotFoundError('Inspection not found');
      }

      const inspection = inspectionResult.rows[0];

      if (inspection.inspector_id !== inspectorId) {
        throw new ValidationError('Only assigned inspector can complete inspection');
      }

      if (inspection.status === 'completed') {
        throw new ConflictError('Inspection already completed');
      }

      // Get all checkpoints
      const checkpointsResult = await client.query(
        'SELECT checkpoint_name, status FROM inspection_checkpoints WHERE inspection_id = $1',
        [inspectionId]
      );

      const checkpoints = checkpointsResult.rows;

      // Calculate result
      const failedCount = checkpoints.filter(cp => cp.status === 'fail').length;
      const warningCount = checkpoints.filter(cp => cp.status === 'warning').length;
      const totalCount = checkpoints.length;

      let result;
      if (failedCount > 0) {
        result = 'fail';
      } else if (warningCount > 2) {
        result = 'conditional';
      } else {
        result = 'pass';
      }

      // Update inspection
      await client.query(
        `UPDATE inspections 
        SET status = $1, result = $2, completed_at = NOW(), updated_at = NOW()
        WHERE id = $3`,
        ['completed', result, inspectionId]
      );

      // Update appointment
      await client.query(
        'UPDATE appointments SET status = $1 WHERE id = $2',
        ['completed', inspection.appointment_id]
      );

      await client.query('COMMIT');

      metrics.inspectionsTotal.inc({ status: 'completed', result });

      // Publish inspection.completed event
      const event = {
        eventId: uuidv4(),
        eventType: 'inspection.completed',
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          inspectionId,
          appointmentId: inspection.appointment_id,
          result,
          completedAt: new Date().toISOString(),
          checkpoints: {
            total: totalCount,
            passed: totalCount - failedCount - warningCount,
            warnings: warningCount,
            failed: failedCount
          }
        },
        metadata: {
          source: 'inspection-certification-service',
          correlationId
        }
      };

      await publishEvent('inspection-events', event);
      metrics.kafkaMessagesSent.inc({ topic: 'inspection-events', status: 'success' });

      logger.info('Inspection completed', {
        correlationId,
        inspectionId,
        result
      });

      // Auto-generate certificate if passed
      if (result === 'pass') {
        try {
          await certificateService.generateCertificate(inspectionId, correlationId);
        } catch (certError) {
          logger.error('Failed to auto-generate certificate', {
            correlationId,
            inspectionId,
            error: certError.message
          });
        }
      }

      return {
        inspectionId,
        result,
        completedAt: new Date().toISOString(),
        checkpoints: {
          total: totalCount,
          passed: totalCount - failedCount - warningCount,
          warnings: warningCount,
          failed: failedCount
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to complete inspection', { correlationId, error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get inspection by ID
   */
  async getInspectionById(inspectionId, userId, userRole) {
    const result = await dbPool.query(
      `SELECT i.*, a.user_id, a.scheduled_date, a.service_type,
        u.first_name AS inspector_first_name, u.last_name AS inspector_last_name
      FROM inspections i
      JOIN appointments a ON i.appointment_id = a.id
      LEFT JOIN users u ON i.inspector_id = u.id
      WHERE i.id = $1`,
      [inspectionId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Inspection not found');
    }

    const inspection = result.rows[0];

    // Check authorization
    if (userRole !== 'admin' && userRole !== 'inspector' && inspection.user_id !== userId) {
      throw new ValidationError('Unauthorized to view this inspection');
    }

    // Get checkpoints
    const checkpointsResult = await dbPool.query(
      'SELECT * FROM inspection_checkpoints WHERE inspection_id = $1 ORDER BY created_at',
      [inspectionId]
    );

    inspection.checkpoints = checkpointsResult.rows;

    return inspection;
  }

  /**
   * List inspections for user/inspector
   */
  async listInspections(filters, limit = 20, offset = 0) {
    const { userId, inspectorId, status, result } = filters;
    
    let query = `
      SELECT i.*, a.scheduled_date, a.service_type, a.user_id,
        u.first_name AS inspector_first_name, u.last_name AS inspector_last_name
      FROM inspections i
      JOIN appointments a ON i.appointment_id = a.id
      LEFT JOIN users u ON i.inspector_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (userId) {
      query += ` AND a.user_id = $${paramCount++}`;
      params.push(userId);
    }

    if (inspectorId) {
      query += ` AND i.inspector_id = $${paramCount++}`;
      params.push(inspectorId);
    }

    if (status) {
      query += ` AND i.status = $${paramCount++}`;
      params.push(status);
    }

    if (result) {
      query += ` AND i.result = $${paramCount++}`;
      params.push(result);
    }

    query += ` ORDER BY i.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limit, offset);

    const result_data = await dbPool.query(query, params);
    return result_data.rows;
  }
}

module.exports = new InspectionService();
