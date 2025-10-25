const db = require('../config/database');
const CertificateService = require('../services/certificate.service');
const Joi = require('joi');

const generateSchema = Joi.object({
  inspectionId: Joi.string().uuid().required(),
  appointmentId: Joi.string().uuid().optional()
});

class CertificateController {
  static async generateCertificate(req, res, next) {
    try {
      const { error, value } = generateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.details });
      }

      const certificate = await CertificateService.generateCertificate(value);

      res.status(201).json({
        success: true,
        message: 'Certificate generated successfully',
        data: certificate
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCertificate(req, res, next) {
    try {
      const { id } = req.params;
      const query = 'SELECT * FROM certificates WHERE id = $1';
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Certificate not found' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }

  static async verifyCertificate(req, res, next) {
    try {
      const { id } = req.params;
      const { digitalSignature } = req.body;

      const query = 'SELECT * FROM certificates WHERE id = $1';
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Certificate not found' });
      }

      const certificate = result.rows[0];
      const verification = await CertificateService.verifyCertificate(
        certificate.certificate_number,
        digitalSignature || certificate.digital_signature
      );

      res.json({
        success: true,
        data: verification
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CertificateController;
