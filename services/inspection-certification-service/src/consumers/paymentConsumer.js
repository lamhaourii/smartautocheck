const { dbPool } = require('../config/database');
const { logger } = require('../config/logger');

/**
 * Handle payment.completed event to unlock inspection
 */
const handlePaymentCompleted = async (eventData, correlationId) => {
  const { appointmentId, paymentId } = eventData.data;

  try {
    logger.info('Processing payment.completed event', {
      correlationId,
      appointmentId,
      paymentId
    });

    // Check if appointment exists
    const appointmentResult = await dbPool.query(
      'SELECT id, status FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (appointmentResult.rows.length === 0) {
      logger.warn('Appointment not found for payment', {
        correlationId,
        appointmentId
      });
      return;
    }

    // Update appointment to unlock inspection
    await dbPool.query(
      'UPDATE appointments SET status = $1, payment_status = $2 WHERE id = $3',
      ['confirmed', 'paid', appointmentId]
    );

    logger.info('Inspection unlocked after payment', {
      correlationId,
      appointmentId
    });
  } catch (error) {
    logger.error('Failed to process payment.completed event', {
      correlationId,
      error: error.message,
      appointmentId
    });
    throw error;
  }
};

module.exports = { handlePaymentCompleted };
