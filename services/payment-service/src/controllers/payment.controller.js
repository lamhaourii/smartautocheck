const db = require('../config/database');
const stripe = require('../config/stripe');
const Joi = require('joi');
const { kafkaService, TOPICS } = require('../config/kafka');

const paymentSchema = Joi.object({
  appointmentId: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().default('USD'),
  paymentMethodId: Joi.string().required()
});

class PaymentController {
  static async processPayment(req, res, next) {
    try {
      const { error, value } = paymentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.details });
      }

      const { appointmentId, amount, currency, paymentMethodId } = value;

      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' }
      });

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
        paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
        'stripe',
        paymentIntent.id,
        JSON.stringify({ stripePaymentIntentId: paymentIntent.id })
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

      // Process refund with Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment.transaction_id
      });

      // Update payment status
      const updateQuery = 'UPDATE payments SET status = $1 WHERE id = $2 RETURNING *';
      const updatedResult = await db.query(updateQuery, ['refunded', id]);

      // Publish refund event
      const kafka = kafkaService();
      await kafka.publishEvent(TOPICS.PAYMENTS, 'payment.refunded', {
        paymentId: payment.id,
        appointmentId: payment.appointment_id,
        amount: payment.amount,
        refundId: refund.id
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
