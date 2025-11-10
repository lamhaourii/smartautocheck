const paymentService = require('../services/payment.service');
const invoiceService = require('../services/invoice.service');
const { logger } = require('../config/logger');

class PaymentController {
  async createPayment(req, res, next) {
    try {
      const userId = req.user.userId;
      const correlationId = req.correlationId;

      const payment = await paymentService.createPayment(
        req.body,
        userId,
        correlationId
      );

      res.status(201).json({
        success: true,
        data: payment,
        correlationId
      });
    } catch (error) {
      next(error);
    }
  }

  async capturePayment(req, res, next) {
    try {
      const { orderId } = req.body;
      const correlationId = req.correlationId;

      const payment = await paymentService.capturePayment(orderId, correlationId);

      // Auto-generate invoice after successful payment
      try {
        const invoiceId = await invoiceService.createInvoice(payment.paymentId, correlationId);
        payment.invoiceId = invoiceId;
      } catch (invoiceError) {
        logger.error('Failed to auto-generate invoice', {
          correlationId,
          paymentId: payment.paymentId,
          error: invoiceError.message
        });
        // Don't fail the payment capture if invoice generation fails
      }

      res.status(200).json({
        success: true,
        data: payment,
        correlationId
      });
    } catch (error) {
      next(error);
    }
  }

  async getPayment(req, res, next) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.userId;

      const payment = await paymentService.getPaymentById(paymentId, userId);

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  async listPayments(req, res, next) {
    try {
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const payments = await paymentService.getUserPayments(userId, limit, offset);

      res.status(200).json({
        success: true,
        data: payments,
        pagination: {
          limit,
          offset,
          total: payments.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async refundPayment(req, res, next) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.userId;
      const correlationId = req.correlationId;

      const refund = await paymentService.refundPayment(
        paymentId,
        userId,
        req.body,
        correlationId
      );

      res.status(200).json({
        success: true,
        data: refund,
        correlationId
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
