const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticateToken, authorize } = require('../middleware/auth');
const { paymentLimiter, authenticatedLimiter } = require('../middleware/rateLimiter');
const { 
  validateCreatePayment, 
  validateCapturePayment, 
  validateRefundPayment 
} = require('../validators/payment.validator');

/**
 * @swagger
 * /api/v1/payments:
 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointmentId
 *               - amount
 *             properties:
 *               appointmentId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *     responses:
 *       201:
 *         description: Payment created successfully
 */
router.post(
  '/',
  authenticateToken,
  authorize('customer', 'admin'),
  paymentLimiter,
  validateCreatePayment,
  paymentController.createPayment
);

/**
 * @swagger
 * /api/v1/payments/capture:
 *   post:
 *     summary: Capture a PayPal payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/capture',
  authenticateToken,
  authorize('customer', 'admin'),
  paymentLimiter,
  validateCapturePayment,
  paymentController.capturePayment
);

/**
 * @swagger
 * /api/v1/payments/{paymentId}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:paymentId',
  authenticateToken,
  authenticatedLimiter,
  paymentController.getPayment
);

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: List user payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticateToken,
  authenticatedLimiter,
  paymentController.listPayments
);

/**
 * @swagger
 * /api/v1/payments/{paymentId}/refund:
 *   post:
 *     summary: Refund a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:paymentId/refund',
  authenticateToken,
  authorize('admin'),
  validateRefundPayment,
  paymentController.refundPayment
);

module.exports = router;
