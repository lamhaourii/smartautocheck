const certificateService = require('../services/certificate.service');

class CertificateController {
  async getCertificate(req, res, next) {
    try {
      const { certificateId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const certificate = await certificateService.getCertificateById(
        certificateId,
        userId,
        userRole
      );

      res.status(200).json({
        success: true,
        data: certificate
      });
    } catch (error) {
      next(error);
    }
  }

  async listCertificates(req, res, next) {
    try {
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const certificates = await certificateService.listUserCertificates(
        userId,
        limit,
        offset
      );

      res.status(200).json({
        success: true,
        data: certificates,
        pagination: {
          limit,
          offset,
          total: certificates.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyCertificate(req, res, next) {
    try {
      const { certificateNumber } = req.params;

      const certificate = await certificateService.getCertificateByNumber(certificateNumber);

      res.status(200).json({
        success: true,
        data: {
          certificateNumber: certificate.certificate_number,
          isValid: certificate.isValid && !certificate.isExpired && certificate.status === 'active',
          isExpired: certificate.isExpired,
          status: certificate.status,
          vehicleInfo: `${certificate.year} ${certificate.make} ${certificate.model}`,
          licensePlate: certificate.license_plate,
          ownerName: `${certificate.first_name} ${certificate.last_name}`,
          issueDate: certificate.issue_date,
          expiryDate: certificate.expiry_date
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadCertificate(req, res, next) {
    try {
      const { certificateId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const certificate = await certificateService.getCertificateById(
        certificateId,
        userId,
        userRole
      );

      // In production, redirect to S3 URL or stream PDF
      res.status(200).json({
        success: true,
        message: 'Certificate download URL',
        data: {
          downloadUrl: `${process.env.API_GATEWAY_URL}/api/v1/certificates/${certificateId}/download`,
          certificateNumber: certificate.certificate_number
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeCertificate(req, res, next) {
    try {
      const { certificateId } = req.params;
      const { reason } = req.body;
      const correlationId = req.correlationId;

      const result = await certificateService.revokeCertificate(
        certificateId,
        reason,
        correlationId
      );

      res.status(200).json({
        success: true,
        message: 'Certificate revoked successfully',
        data: result,
        correlationId
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CertificateController();
