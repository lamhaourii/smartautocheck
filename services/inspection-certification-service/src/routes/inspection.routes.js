const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspection.controller');
const { authenticateToken, authorize } = require('../middleware/auth');
const { authenticatedLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /api/v1/inspections/start:
 *   post:
 *     summary: Start a new inspection
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/start',
  authenticateToken,
  authorize('inspector', 'admin'),
  authenticatedLimiter,
  inspectionController.startInspection
);

/**
 * @swagger
 * /api/v1/inspections/{inspectionId}/checkpoint:
 *   post:
 *     summary: Update inspection checkpoint
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:inspectionId/checkpoint',
  authenticateToken,
  authorize('inspector', 'admin'),
  authenticatedLimiter,
  inspectionController.updateCheckpoint
);

/**
 * @swagger
 * /api/v1/inspections/{inspectionId}/complete:
 *   post:
 *     summary: Complete inspection
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:inspectionId/complete',
  authenticateToken,
  authorize('inspector', 'admin'),
  authenticatedLimiter,
  inspectionController.completeInspection
);

/**
 * @swagger
 * /api/v1/inspections/{inspectionId}:
 *   get:
 *     summary: Get inspection by ID
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:inspectionId',
  authenticateToken,
  authenticatedLimiter,
  inspectionController.getInspection
);

/**
 * @swagger
 * /api/v1/inspections:
 *   get:
 *     summary: List inspections
 *     tags: [Inspections]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticateToken,
  authenticatedLimiter,
  inspectionController.listInspections
);

module.exports = router;
