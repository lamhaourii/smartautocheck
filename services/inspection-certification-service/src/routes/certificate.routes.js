const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificate.controller');
const { authenticateToken, authorize } = require('../middleware/auth');
const { authenticatedLimiter, anonymousLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/v1/certificates/{certificateId}:
 *   get:
 *     summary: Get certificate by ID
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:certificateId',
  authenticateToken,
  authenticatedLimiter,
  certificateController.getCertificate
);

/**
 * @swagger
 * /api/v1/certificates:
 *   get:
 *     summary: List user certificates
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticateToken,
  authenticatedLimiter,
  certificateController.listCertificates
);

/**
 * @swagger
 * /api/v1/certificates/{certificateId}/download:
 *   get:
 *     summary: Download certificate PDF
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:certificateId/download',
  authenticateToken,
  authenticatedLimiter,
  certificateController.downloadCertificate
);

/**
 * @swagger
 * /api/v1/certificates/verify/{certificateNumber}:
 *   get:
 *     summary: Verify certificate authenticity (public)
 *     tags: [Certificates]
 */
router.get(
  '/verify/:certificateNumber',
  anonymousLimiter,
  certificateController.verifyCertificate
);

/**
 * @swagger
 * /api/v1/certificates/{certificateId}/revoke:
 *   post:
 *     summary: Revoke certificate (admin only)
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:certificateId/revoke',
  authenticateToken,
  authorize('admin'),
  certificateController.revokeCertificate
);

module.exports = router;
