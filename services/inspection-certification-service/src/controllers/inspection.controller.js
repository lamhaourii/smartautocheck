const inspectionService = require('../services/inspection.service');

class InspectionController {
  async startInspection(req, res, next) {
    try {
      const { appointmentId } = req.body;
      const inspectorId = req.user.userId;
      const correlationId = req.correlationId;

      const inspection = await inspectionService.startInspection(
        appointmentId,
        inspectorId,
        correlationId
      );

      res.status(201).json({
        success: true,
        data: inspection,
        correlationId
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCheckpoint(req, res, next) {
    try {
      const { inspectionId } = req.params;
      const checkpointData = req.body;
      const correlationId = req.correlationId;

      await inspectionService.updateCheckpoint(inspectionId, checkpointData, correlationId);

      res.status(200).json({
        success: true,
        message: 'Checkpoint updated successfully',
        correlationId
      });
    } catch (error) {
      next(error);
    }
  }

  async completeInspection(req, res, next) {
    try {
      const { inspectionId } = req.params;
      const inspectorId = req.user.userId;
      const correlationId = req.correlationId;

      const result = await inspectionService.completeInspection(
        inspectionId,
        inspectorId,
        correlationId
      );

      res.status(200).json({
        success: true,
        data: result,
        correlationId
      });
    } catch (error) {
      next(error);
    }
  }

  async getInspection(req, res, next) {
    try {
      const { inspectionId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const inspection = await inspectionService.getInspectionById(
        inspectionId,
        userId,
        userRole
      );

      res.status(200).json({
        success: true,
        data: inspection
      });
    } catch (error) {
      next(error);
    }
  }

  async listInspections(req, res, next) {
    try {
      const userId = req.user.role === 'customer' ? req.user.userId : null;
      const inspectorId = req.user.role === 'inspector' ? req.user.userId : null;
      const { status, result } = req.query;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const inspections = await inspectionService.listInspections(
        { userId, inspectorId, status, result },
        limit,
        offset
      );

      res.status(200).json({
        success: true,
        data: inspections,
        pagination: {
          limit,
          offset,
          total: inspections.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InspectionController();
