const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticateToken } = require('../middleware/auth');
const { authenticatedLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/v1/invoices/{invoiceId}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:invoiceId',
  authenticateToken,
  authenticatedLimiter,
  invoiceController.getInvoice
);

/**
 * @swagger
 * /api/v1/invoices:
 *   get:
 *     summary: List user invoices
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticateToken,
  authenticatedLimiter,
  invoiceController.listInvoices
);

/**
 * @swagger
 * /api/v1/invoices/{invoiceId}/download:
 *   get:
 *     summary: Download invoice PDF
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:invoiceId/download',
  authenticateToken,
  authenticatedLimiter,
  invoiceController.downloadInvoice
);

/**
 * @swagger
 * /api/v1/invoices/verify/{invoiceNumber}:
 *   get:
 *     summary: Verify invoice authenticity (public)
 *     tags: [Invoices]
 */
router.get(
  '/verify/:invoiceNumber',
  invoiceController.verifyInvoice
);

module.exports = router;
