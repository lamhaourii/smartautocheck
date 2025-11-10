const { v4: uuidv4 } = require('uuid');
const { dbPool } = require('../config/database');
const { createOrderBreaker, captureOrderBreaker, refundCaptureBreaker } = require('../config/paypal');
const { publishEvent } = require('../config/kafka');
const { logger } = require('../config/logger');
const { metrics } = require('../middleware/metrics');
const { PaymentError, NotFoundError } = require('../middleware/errorHandler');

class PaymentService {
  async createPayment(paymentData, userId, correlationId) {
    const { appointmentId, amount, currency = 'USD', returnUrl, cancelUrl } = paymentData;

    try {
      // Verify appointment exists and belongs to user
      const appointmentResult = await dbPool.query(
        'SELECT id, user_id, status FROM appointments WHERE id = $1',
        [appointmentId]
      );

      if (appointmentResult.rows.length === 0) {
        throw new NotFoundError('Appointment not found');
      }

      const appointment = appointmentResult.rows[0];
      if (appointment.user_id !== userId) {
        throw new PaymentError('Unauthorized to pay for this appointment');
      }

      // Create PayPal order
      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: appointmentId,
          description: `Vehicle Inspection Service - ${appointmentId}`,
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          }
        }],
        application_context: {
          brand_name: 'SmartAutoCheck',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: returnUrl || process.env.PAYPAL_RETURN_URL,
          cancel_url: cancelUrl || process.env.PAYPAL_CANCEL_URL
        }
      };

      const paypalOrder = await createOrderBreaker.fire(orderData);

      // Store payment in database
      const paymentId = uuidv4();
      await dbPool.query(
        `INSERT INTO payments 
        (id, appointment_id, user_id, amount, currency, payment_method, paypal_order_id, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [paymentId, appointmentId, userId, amount, currency, 'paypal', paypalOrder.id, 'pending']
      );

      metrics.paymentTransactions.inc({ status: 'created', payment_method: 'paypal' });

      logger.info('Payment created', {
        correlationId,
        paymentId,
        appointmentId,
        amount,
        paypalOrderId: paypalOrder.id
      });

      // Get approval URL
      const approvalUrl = paypalOrder.links.find(link => link.rel === 'approve')?.href;

      return {
        paymentId,
        orderId: paypalOrder.id,
        status: 'pending',
        amount,
        currency,
        approvalUrl
      };
    } catch (error) {
      metrics.paymentTransactions.inc({ status: 'failed', payment_method: 'paypal' });
      logger.error('Failed to create payment', { correlationId, error: error.message });
      throw error;
    }
  }

  async capturePayment(orderId, correlationId) {
    try {
      // Capture the PayPal order
      const capturedOrder = await captureOrderBreaker.fire(orderId);

      // Update payment in database
      const captureId = capturedOrder.purchase_units[0].payments.captures[0].id;
      const amount = parseFloat(capturedOrder.purchase_units[0].payments.captures[0].amount.value);
      const appointmentId = capturedOrder.purchase_units[0].reference_id;

      const result = await dbPool.query(
        `UPDATE payments 
        SET status = $1, paypal_capture_id = $2, captured_at = NOW(), updated_at = NOW()
        WHERE paypal_order_id = $3
        RETURNING id, user_id, appointment_id`,
        ['completed', captureId, orderId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Payment not found');
      }

      const payment = result.rows[0];

      // Update appointment status to paid
      await dbPool.query(
        'UPDATE appointments SET payment_status = $1, status = $2 WHERE id = $3',
        ['paid', 'confirmed', appointmentId]
      );

      metrics.paymentTransactions.inc({ status: 'completed', payment_method: 'paypal' });

      // Publish payment.completed event
      const event = {
        eventId: uuidv4(),
        eventType: 'payment.completed',
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
          paymentId: payment.id,
          appointmentId: payment.appointment_id,
          userId: payment.user_id,
          amount,
          currency: 'USD',
          paymentMethod: 'paypal',
          transactionId: captureId
        },
        metadata: {
          source: 'payment-invoice-service',
          correlationId
        }
      };

      await publishEvent('payment-events', event);
      metrics.kafkaMessagesSent.inc({ topic: 'payment-events', status: 'success' });

      logger.info('Payment captured successfully', {
        correlationId,
        paymentId: payment.id,
        appointmentId,
        amount
      });

      return {
        paymentId: payment.id,
        status: 'completed',
        amount,
        transactionId: captureId,
        capturedAt: new Date().toISOString()
      };
    } catch (error) {
      metrics.paymentTransactions.inc({ status: 'capture_failed', payment_method: 'paypal' });
      logger.error('Failed to capture payment', { correlationId, error: error.message });
      throw new PaymentError('Payment capture failed: ' + error.message);
    }
  }

  async getPaymentById(paymentId, userId) {
    const result = await dbPool.query(
      `SELECT p.*, a.scheduled_date, a.service_type
      FROM payments p
      LEFT JOIN appointments a ON p.appointment_id = a.id
      WHERE p.id = $1 AND p.user_id = $2`,
      [paymentId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Payment not found');
    }

    return result.rows[0];
  }

  async getUserPayments(userId, limit = 20, offset = 0) {
    const result = await dbPool.query(
      `SELECT p.*, a.scheduled_date, a.service_type
      FROM payments p
      LEFT JOIN appointments a ON p.appointment_id = a.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  async refundPayment(paymentId, userId, refundData, correlationId) {
    try {
      // Get payment details
      const paymentResult = await dbPool.query(
        'SELECT * FROM payments WHERE id = $1 AND user_id = $2',
        [paymentId, userId]
      );

      if (paymentResult.rows.length === 0) {
        throw new NotFoundError('Payment not found');
      }

      const payment = paymentResult.rows[0];

      if (payment.status !== 'completed') {
        throw new PaymentError('Only completed payments can be refunded');
      }

      if (payment.refund_status === 'refunded') {
        throw new PaymentError('Payment already refunded');
      }

      const refundAmount = refundData.amount || payment.amount;

      // Process refund via PayPal
      const refundResult = await refundCaptureBreaker.fire(
        payment.paypal_capture_id,
        refundAmount
      );

      // Update payment in database
      await dbPool.query(
        `UPDATE payments 
        SET refund_status = $1, refund_amount = $2, refund_id = $3, refunded_at = NOW(), updated_at = NOW()
        WHERE id = $4`,
        ['refunded', refundAmount, refundResult.id, paymentId]
      );

      logger.info('Payment refunded successfully', {
        correlationId,
        paymentId,
        refundAmount,
        refundId: refundResult.id
      });

      return {
        paymentId,
        refundId: refundResult.id,
        refundAmount,
        refundStatus: 'refunded',
        refundedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to refund payment', { correlationId, error: error.message });
      throw new PaymentError('Refund failed: ' + error.message);
    }
  }
}

module.exports = new PaymentService();
