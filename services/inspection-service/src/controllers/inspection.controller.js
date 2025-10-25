const db = require('../config/database');
const Joi = require('joi');
const { kafkaService } = require('../config/kafka');

const CHECKPOINTS = [
  { id: 'brakes', name: 'Brakes', required: true },
  { id: 'lights', name: 'Lights and Signals', required: true },
  { id: 'tires', name: 'Tires and Wheels', required: true },
  { id: 'suspension', name: 'Suspension', required: true },
  { id: 'steering', name: 'Steering System', required: true },
  { id: 'emissions', name: 'Emissions', required: true },
  { id: 'windshield', name: 'Windshield and Wipers', required: true },
  { id: 'bodywork', name: 'Bodywork', required: false },
  { id: 'interior', name: 'Interior Safety', required: true }
];

const startSchema = Joi.object({
  appointmentId: Joi.string().uuid().required(),
  inspectorId: Joi.string().uuid().required()
});

const updateCheckpointSchema = Joi.object({
  checkpointId: Joi.string().required(),
  status: Joi.string().valid('pass', 'fail', 'warning').required(),
  notes: Joi.string().optional()
});

class InspectionController {
  static async startInspection(req, res, next) {
    try {
      const { error, value } = startSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.details });
      }

      const { appointmentId, inspectorId } = value;

      // Initialize checkpoints
      const checkpoints = CHECKPOINTS.map(cp => ({
        ...cp,
        status: 'pending',
        notes: ''
      }));

      const query = `
        INSERT INTO inspections (appointment_id, inspector_id, status, checkpoints)
        VALUES ($1, $2, 'in_progress', $3)
        RETURNING *
      `;

      const result = await db.query(query, [appointmentId, inspectorId, JSON.stringify(checkpoints)]);
      const inspection = result.rows[0];

      // Publish event
      const kafka = kafkaService();
      await kafka.publishEvent('inspections-topic', 'inspection.started', {
        inspectionId: inspection.id,
        appointmentId: inspection.appointment_id,
        inspectorId: inspection.inspector_id,
        startedAt: inspection.created_at
      });

      res.status(201).json({
        success: true,
        message: 'Inspection started',
        data: inspection
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateCheckpoint(req, res, next) {
    try {
      const { id } = req.params;
      const { error, value } = updateCheckpointSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.details });
      }

      // Get current inspection
      const selectQuery = 'SELECT * FROM inspections WHERE id = $1';
      const selectResult = await db.query(selectQuery, [id]);
      
      if (selectResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      const inspection = selectResult.rows[0];
      const checkpoints = JSON.parse(inspection.checkpoints);

      // Update checkpoint
      const checkpointIndex = checkpoints.findIndex(cp => cp.id === value.checkpointId);
      if (checkpointIndex === -1) {
        return res.status(404).json({ success: false, message: 'Checkpoint not found' });
      }

      checkpoints[checkpointIndex] = {
        ...checkpoints[checkpointIndex],
        status: value.status,
        notes: value.notes || checkpoints[checkpointIndex].notes
      };

      // Update inspection
      const updateQuery = 'UPDATE inspections SET checkpoints = $1 WHERE id = $2 RETURNING *';
      const updateResult = await db.query(updateQuery, [JSON.stringify(checkpoints), id]);

      // Publish event
      const kafka = kafkaService();
      await kafka.publishEvent('inspections-topic', 'inspection.checkpoint.updated', {
        inspectionId: id,
        checkpointId: value.checkpointId,
        status: value.status
      });

      res.json({
        success: true,
        message: 'Checkpoint updated',
        data: updateResult.rows[0]
      });
    } catch (err) {
      next(err);
    }
  }

  static async completeInspection(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      // Get inspection
      const selectQuery = 'SELECT * FROM inspections WHERE id = $1';
      const selectResult = await db.query(selectQuery, [id]);

      if (selectResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      const inspection = selectResult.rows[0];
      const checkpoints = JSON.parse(inspection.checkpoints);

      // Calculate result
      const requiredCheckpoints = checkpoints.filter(cp => cp.required);
      const failedRequired = requiredCheckpoints.filter(cp => cp.status === 'fail');
      const warnings = checkpoints.filter(cp => cp.status === 'warning');

      let result;
      if (failedRequired.length > 0) {
        result = 'fail';
      } else if (warnings.length > 0) {
        result = 'conditional';
      } else {
        result = 'pass';
      }

      // Update inspection
      const updateQuery = `
        UPDATE inspections 
        SET status = 'completed', result = $1, notes = $2, completed_at = NOW()
        WHERE id = $3
        RETURNING *
      `;
      const updateResult = await db.query(updateQuery, [result, notes, id]);

      const completedInspection = updateResult.rows[0];

      // Publish event
      const kafka = kafkaService();
      await kafka.publishEvent('inspections-topic', 'inspection.completed', {
        inspectionId: completedInspection.id,
        appointmentId: completedInspection.appointment_id,
        result: completedInspection.result,
        checkpoints: JSON.parse(completedInspection.checkpoints),
        notes: completedInspection.notes,
        completedAt: completedInspection.completed_at
      });

      res.json({
        success: true,
        message: 'Inspection completed',
        data: completedInspection
      });
    } catch (err) {
      next(err);
    }
  }

  static async getInspection(req, res, next) {
    try {
      const { id } = req.params;
      const query = 'SELECT * FROM inspections WHERE id = $1';
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = InspectionController;
