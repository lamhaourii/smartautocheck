const AppointmentModel = require('../models/appointment.model');
const Joi = require('joi');
const { kafkaService, TOPICS, EVENT_TYPES } = require('../config/kafka');
const redisClient = require('../config/redis');
const db = require('../config/database');

const createSchema = Joi.object({
  vehicleId: Joi.string().uuid().optional(),
  vehicleInfo: Joi.object({
    registrationNumber: Joi.string().required(),
    make: Joi.string().required(),
    model: Joi.string().required(),
    year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required()
  }).optional(),
  scheduledDate: Joi.date().iso().greater('now').required(),
  serviceType: Joi.string().required(),
  notes: Joi.string().optional()
}).xor('vehicleId', 'vehicleInfo');

const updateSchema = Joi.object({
  scheduledDate: Joi.date().iso().optional(),
  status: Joi.string().valid('pending', 'confirmed', 'in_progress', 'completed', 'cancelled').optional(),
  notes: Joi.string().optional(),
  serviceType: Joi.string().optional()
});

class AppointmentController {
  static async createAppointment(req, res, next) {
    try {
      // Extract userId from JWT token
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { error, value } = createSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details
        });
      }

      let vehicleId = value.vehicleId;

      // If vehicleInfo is provided, create or find the vehicle
      if (value.vehicleInfo) {
        const { registrationNumber, make, model, year } = value.vehicleInfo;
        
        // Check if vehicle already exists
        const existingVehicle = await db.query(
          'SELECT id FROM vehicles WHERE registration_number = $1 AND user_id = $2',
          [registrationNumber, userId]
        );

        if (existingVehicle.rows.length > 0) {
          vehicleId = existingVehicle.rows[0].id;
        } else {
          // Create new vehicle
          const newVehicle = await db.query(
            `INSERT INTO vehicles (user_id, registration_number, make, model, year)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [userId, registrationNumber, make, model, year]
          );
          vehicleId = newVehicle.rows[0].id;
        }
      }

      // Check availability
      const appointmentsOnDate = await AppointmentModel.checkAvailability(value.scheduledDate);
      const MAX_APPOINTMENTS_PER_DAY = 20;
      
      if (appointmentsOnDate >= MAX_APPOINTMENTS_PER_DAY) {
        return res.status(409).json({
          success: false,
          message: 'No available slots for this date'
        });
      }

      const appointmentData = {
        userId,
        vehicleId,
        scheduledDate: value.scheduledDate,
        serviceType: value.serviceType,
        notes: value.notes
      };

      const appointment = await AppointmentModel.create(appointmentData);

      // Publish event to Kafka
      const kafka = kafkaService();
      await kafka.publishEvent(
        TOPICS.APPOINTMENTS,
        EVENT_TYPES.APPOINTMENT_CREATED,
        {
          appointmentId: appointment.id,
          userId: appointment.user_id,
          vehicleId: appointment.vehicle_id,
          scheduledDate: appointment.scheduled_date,
          serviceType: appointment.service_type,
          status: appointment.status
        },
        { userId: value.userId }
      );

      // Also publish notification event
      await kafka.publishEvent(
        TOPICS.NOTIFICATIONS,
        'notification.email',
        {
          recipient: value.userId,
          template: 'appointment_confirmation',
          data: {
            appointmentId: appointment.id,
            scheduledDate: appointment.scheduled_date,
            serviceType: appointment.service_type
          }
        }
      );

      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: appointment
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAppointment(req, res, next) {
    try {
      const { id } = req.params;

      // Try cache first
      const cached = await redisClient.get(`appointment:${id}`);
      if (cached) {
        return res.json({
          success: true,
          data: JSON.parse(cached),
          cached: true
        });
      }

      const appointment = await AppointmentModel.findById(id);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Cache for 5 minutes
      await redisClient.setEx(`appointment:${id}`, 300, JSON.stringify(appointment));

      res.json({
        success: true,
        data: appointment
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateAppointment(req, res, next) {
    try {
      const { id } = req.params;

      const { error, value } = updateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details
        });
      }

      const existing = await AppointmentModel.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      const appointment = await AppointmentModel.update(id, value);

      // Invalidate cache
      await redisClient.del(`appointment:${id}`);

      // Publish event to Kafka
      const kafka = kafkaService();
      await kafka.publishEvent(
        TOPICS.APPOINTMENTS,
        EVENT_TYPES.APPOINTMENT_UPDATED,
        {
          appointmentId: appointment.id,
          updates: value,
          previousStatus: existing.status,
          newStatus: appointment.status
        }
      );

      res.json({
        success: true,
        message: 'Appointment updated successfully',
        data: appointment
      });
    } catch (err) {
      next(err);
    }
  }

  static async cancelAppointment(req, res, next) {
    try {
      const { id } = req.params;

      const existing = await AppointmentModel.findById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      const appointment = await AppointmentModel.update(id, { status: 'cancelled' });

      // Invalidate cache
      await redisClient.del(`appointment:${id}`);

      // Publish event to Kafka
      const kafka = kafkaService();
      await kafka.publishEvent(
        TOPICS.APPOINTMENTS,
        EVENT_TYPES.APPOINTMENT_CANCELLED,
        {
          appointmentId: appointment.id,
          userId: appointment.user_id,
          reason: req.body.reason || 'User requested cancellation',
          cancelledAt: new Date().toISOString()
        }
      );

      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: appointment
      });
    } catch (err) {
      next(err);
    }
  }

  static async checkAvailability(req, res, next) {
    try {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date parameter is required'
        });
      }

      const count = await AppointmentModel.checkAvailability(date);
      const MAX_APPOINTMENTS_PER_DAY = 20;
      const available = MAX_APPOINTMENTS_PER_DAY - count;

      res.json({
        success: true,
        data: {
          date,
          available: available > 0,
          slotsRemaining: Math.max(0, available),
          totalSlots: MAX_APPOINTMENTS_PER_DAY
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async listAppointments(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      const filters = {
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const [appointments, total] = await Promise.all([
        AppointmentModel.findAll(filters, limit, offset),
        AppointmentModel.count(filters)
      ]);

      res.json({
        success: true,
        data: appointments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AppointmentController;
