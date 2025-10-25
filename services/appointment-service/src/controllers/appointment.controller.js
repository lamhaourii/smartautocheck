const AppointmentModel = require('../models/appointment.model');
const Joi = require('joi');
const { kafkaService, TOPICS, EVENT_TYPES } = require('../config/kafka');
const redisClient = require('../config/redis');

const createSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  vehicleId: Joi.string().uuid().required(),
  scheduledDate: Joi.date().iso().greater('now').required(),
  serviceType: Joi.string().required(),
  notes: Joi.string().optional()
});

const updateSchema = Joi.object({
  scheduledDate: Joi.date().iso().optional(),
  status: Joi.string().valid('pending', 'confirmed', 'in_progress', 'completed', 'cancelled').optional(),
  notes: Joi.string().optional(),
  serviceType: Joi.string().optional()
});

class AppointmentController {
  static async createAppointment(req, res, next) {
    try {
      const { error, value } = createSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details
        });
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

      const appointment = await AppointmentModel.create(value);

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
