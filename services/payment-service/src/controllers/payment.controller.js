const db = require('../config/database');
const paypal = require('@paypal/checkout-server-sdk');
const { client: paypalClient } = require('../config/paypal');
const Joi = require('joi');
const { kafkaService, TOPICS } = require('../config/kafka');

const paymentSchema = Joi.object({
  appointmentId: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().default('USD'),
  orderId: Joi.string().required() // PayPal order ID from frontend
});

class PaymentController {
  static async processPayment(req, res, next) {
    try {
      const { error, value } = paymentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.details });
      }

      const { appointmentId, amount, currency, orderId } = value;

      const client = paypalClient();
      let paymentStatus = 'completed';
      let transactionId = orderId;

      // Capture the PayPal order
      if (client) {
        try {
          const request = new paypal.orders.OrdersCaptureRequest(orderId);
          request.requestBody({});
          const capture = await client.execute(request);
          
          paymentStatus = capture.result.status === 'COMPLETED' ? 'completed' : 'pending';
          transactionId = capture.result.id;
        } catch (paypalError) {
          console.error('PayPal capture error:', paypalError);
          return res.status(400).json({
            success: false,
            message: 'PayPal payment capture failed',
            error: paypalError.message
          });
        }
      } else {
        // Mock mode for testing without PayPal credentials
        console.log('PayPal mock mode: Payment processed');
      }

      // Save payment to database
      const query = `
        INSERT INTO payments (appointment_id, amount, currency, status, payment_method, transaction_id, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const result = await db.query(query, [
        appointmentId,
        amount,
        currency,
        paymentStatus,
        'paypal',
        transactionId,
        JSON.stringify({ paypalOrderId: orderId })
      ]);

      const payment = result.rows[0];

      // Publish payment completed event to Kafka
      if (payment.status === 'completed') {
        const kafka = kafkaService();
        
        await kafka.publishEvent(TOPICS.PAYMENTS, 'payment.completed', {
          paymentId: payment.id,
          appointmentId: payment.appointment_id,
          amount: payment.amount,
          currency: payment.currency,
          transactionId: payment.transaction_id
        });

        // Trigger invoice generation
        await kafka.publishEvent(TOPICS.INVOICES, 'invoice.create', {
          paymentId: payment.id,
          appointmentId: payment.appointment_id,
          amount: payment.amount
        });
      }

      res.status(201).json({
        success: true,
        message: 'Payment processed successfully',
        data: payment
      });
    } catch (err) {
      next(err);
    }
  }

  static async createOrder(req, res, next) {
    try {
      const { amount, currency = 'USD' } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
      }

      const client = paypalClient();

      if (!client) {
        // Mock mode - return fake order ID
        return res.json({
          success: true,
          data: { orderId: `MOCK-ORDER-${Date.now()}` }
        });
      }

      // Create PayPal order
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          }
        }]
      });

      const order = await client.execute(request);

      res.json({
        success: true,
        data: { orderId: order.result.id }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPayment(req, res, next) {
    try {
      const { id } = req.params;
      const query = 'SELECT * FROM payments WHERE id = $1';
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }

  static async refundPayment(req, res, next) {
    try {
      const { id } = req.params;
      
      const query = 'SELECT * FROM payments WHERE id = $1';
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      const payment = result.rows[0];

      if (payment.status !== 'completed') {
        return res.status(400).json({ success: false, message: 'Only completed payments can be refunded' });
      }

      const client = paypalClient();
      let refundId = `refund-${Date.now()}`;

      // Process refund with PayPal
      if (client) {
        try {
          // Get capture ID from the order
          const metadata = JSON.parse(payment.metadata || '{}');
          const captureId = payment.transaction_id;
          
          const request = new paypal.payments.CapturesRefundRequest(captureId);
          request.requestBody({
            amount: {
              value: payment.amount.toString(),
              currency_code: payment.currency
            }
          });
          
          const refund = await client.execute(request);
          refundId = refund.result.id;
        } catch (paypalError) {
          console.error('PayPal refund error:', paypalError);
          return res.status(400).json({
            success: false,
            message: 'PayPal refund failed',
            error: paypalError.message
          });
        }
      } else {
        console.log('PayPal mock mode: Refund processed');
      }

      // Update payment status
      const updateQuery = 'UPDATE payments SET status = $1 WHERE id = $2 RETURNING *';
      const updatedResult = await db.query(updateQuery, ['refunded', id]);

      // Publish refund event
      const kafka = kafkaService();
      await kafka.publishEvent(TOPICS.PAYMENTS, 'payment.refunded', {
        paymentId: payment.id,
        appointmentId: payment.appointment_id,
        amount: payment.amount,
        refundId: refundId
      });

      res.json({
        success: true,
        message: 'Payment refunded successfully',
        data: updatedResult.rows[0]
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PaymentController;
