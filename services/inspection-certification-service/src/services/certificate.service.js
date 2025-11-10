const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { dbPool } = require('../config/database');
const { logger } = require('../config/logger');
const { metrics } = require('../middleware/metrics');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');

class CertificateService {
  /**
   * Generate certificate number
   */
  generateCertificateNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `CERT-${year}${month}-${random}`;
  }

  /**
   * Calculate expiry date (1 year from issue)
   */
  calculateExpiryDate() {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    return expiryDate;
  }

  /**
   * Generate digital signature for certificate
   */
  generateDigitalSignature(certificateData) {
    const secret = process.env.CERTIFICATE_SECRET || 'certificate-signing-key';
    const dataString = JSON.stringify({
      certificateNumber: certificateData.certificateNumber,
      inspectionId: certificateData.inspectionId,
      issueDate: certificateData.issueDate
    });
    
    return crypto
      .createHmac('sha256', secret)
      .update(dataString)
      .digest('hex');
  }

  /**
   * Verify certificate signature
   */
  verifyDigitalSignature(certificateData, signature) {
    const expectedSignature = this.generateDigitalSignature(certificateData);
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  }

  /**
   * Generate certificate after passed inspection
   */
  async generateCertificate(inspectionId, correlationId) {
    try {
      // Get inspection details
      const inspectionResult = await dbPool.query(
        `SELECT i.*, a.user_id, a.vehicle_id, a.service_type,
          u.first_name, u.last_name, u.email,
          v.make, v.model, v.year, v.license_plate, v.vin
        FROM inspections i
        JOIN appointments a ON i.appointment_id = a.id
        JOIN users u ON a.user_id = u.id
        LEFT JOIN vehicles v ON a.vehicle_id = v.id
        WHERE i.id = $1`,
        [inspectionId]
      );

      if (inspectionResult.rows.length === 0) {
        throw new NotFoundError('Inspection not found');
      }

      const inspection = inspectionResult.rows[0];

      if (inspection.result !== 'pass') {
        throw new ValidationError('Certificates can only be generated for passed inspections');
      }

      // Check if certificate already exists
      const existingCert = await dbPool.query(
        'SELECT id FROM certificates WHERE inspection_id = $1',
        [inspectionId]
      );

      if (existingCert.rows.length > 0) {
        logger.info('Certificate already exists', { correlationId, inspectionId });
        return existingCert.rows[0].id;
      }

      // Create certificate record
      const certificateId = uuidv4();
      const certificateNumber = this.generateCertificateNumber();
      const issueDate = new Date();
      const expiryDate = this.calculateExpiryDate();

      const certificateData = {
        certificateNumber,
        inspectionId,
        issueDate: issueDate.toISOString()
      };

      const digitalSignature = this.generateDigitalSignature(certificateData);

      await dbPool.query(
        `INSERT INTO certificates 
        (id, certificate_number, inspection_id, user_id, vehicle_id, 
         issue_date, expiry_date, status, digital_signature, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          certificateId,
          certificateNumber,
          inspectionId,
          inspection.user_id,
          inspection.vehicle_id,
          issueDate,
          expiryDate,
          'active',
          digitalSignature
        ]
      );

      // Generate PDF (stored as buffer, in production save to S3)
      const pdfBuffer = await this.generateCertificatePDF({
        certificateId,
        certificateNumber,
        customerName: `${inspection.first_name} ${inspection.last_name}`,
        vehicleInfo: `${inspection.year} ${inspection.make} ${inspection.model}`,
        licensePlate: inspection.license_plate,
        vin: inspection.vin,
        serviceType: inspection.service_type,
        issueDate,
        expiryDate,
        digitalSignature
      });

      // Update with PDF path
      await dbPool.query(
        'UPDATE certificates SET pdf_path = $1 WHERE id = $2',
        [`/certificates/${certificateNumber}.pdf`, certificateId]
      );

      metrics.certificatesGenerated.inc({ status: 'success' });

      logger.info('Certificate generated successfully', {
        correlationId,
        certificateId,
        certificateNumber,
        inspectionId
      });

      return certificateId;
    } catch (error) {
      metrics.certificatesGenerated.inc({ status: 'failed' });
      logger.error('Failed to generate certificate', { correlationId, error: error.message });
      throw error;
    }
  }

  /**
   * Generate certificate PDF
   */
  async generateCertificatePDF(data) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Certificate border
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
        doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50).stroke();

        // Header
        doc.fontSize(24).font('Helvetica-Bold')
          .text('VEHICLE INSPECTION CERTIFICATE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).font('Helvetica')
          .text('SmartAutoCheck Technical Inspection Center', { align: 'center' });
        doc.moveDown(2);

        // Certificate number
        doc.fontSize(12).font('Helvetica-Bold')
          .text(`Certificate No: ${data.certificateNumber}`, { align: 'center' });
        doc.moveDown(2);

        // Certificate body
        doc.fontSize(11).font('Helvetica');
        doc.text('This is to certify that the following vehicle has been inspected and', { align: 'center' });
        doc.text('found to be in compliance with safety and emissions standards.', { align: 'center' });
        doc.moveDown(2);

        // Vehicle details box
        const boxTop = 250;
        doc.rect(80, boxTop, doc.page.width - 160, 150).stroke();

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('VEHICLE INFORMATION', 100, boxTop + 15);
        
        doc.font('Helvetica');
        doc.text(`Owner: ${data.customerName}`, 100, boxTop + 40);
        doc.text(`Vehicle: ${data.vehicleInfo}`, 100, boxTop + 60);
        doc.text(`License Plate: ${data.licensePlate}`, 100, boxTop + 80);
        doc.text(`VIN: ${data.vin || 'N/A'}`, 100, boxTop + 100);
        doc.text(`Inspection Type: ${data.serviceType}`, 100, boxTop + 120);

        // Dates
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('VALIDITY PERIOD', 100, boxTop + 170);
        doc.font('Helvetica');
        doc.text(`Issue Date: ${new Date(data.issueDate).toLocaleDateString()}`, 100, boxTop + 190);
        doc.text(`Expiry Date: ${new Date(data.expiryDate).toLocaleDateString()}`, 100, boxTop + 210);

        // QR Code for verification
        const qrCodeData = `${process.env.FRONTEND_URL}/certificates/${data.certificateId}/verify`;
        const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, { width: 120 });
        doc.image(qrCodeBuffer, doc.page.width - 170, boxTop + 15, { width: 120 });

        // Digital signature
        doc.fontSize(8).font('Helvetica');
        doc.text('Digital Signature:', 80, boxTop + 240);
        doc.fontSize(7).text(data.digitalSignature.substring(0, 32) + '...', 80, boxTop + 255);

        // Footer
        doc.fontSize(9).font('Helvetica-Italic');
        doc.text(
          'This certificate is valid for one year from the issue date.',
          50,
          doc.page.height - 100,
          { align: 'center', width: doc.page.width - 100 }
        );

        doc.fontSize(8);
        doc.text(
          'Scan QR code or visit our website to verify authenticity.',
          50,
          doc.page.height - 80,
          { align: 'center', width: doc.page.width - 100 }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get certificate by ID
   */
  async getCertificateById(certificateId, userId, userRole) {
    const result = await dbPool.query(
      `SELECT c.*, v.make, v.model, v.year, v.license_plate,
        u.first_name, u.last_name, u.email
      FROM certificates c
      LEFT JOIN vehicles v ON c.vehicle_id = v.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1`,
      [certificateId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Certificate not found');
    }

    const certificate = result.rows[0];

    // Check authorization
    if (userRole !== 'admin' && certificate.user_id !== userId) {
      throw new ValidationError('Unauthorized to view this certificate');
    }

    return certificate;
  }

  /**
   * Get certificate by number (public verification)
   */
  async getCertificateByNumber(certificateNumber) {
    const result = await dbPool.query(
      `SELECT c.*, v.make, v.model, v.year, v.license_plate,
        u.first_name, u.last_name
      FROM certificates c
      LEFT JOIN vehicles v ON c.vehicle_id = v.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.certificate_number = $1`,
      [certificateNumber]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Certificate not found');
    }

    const certificate = result.rows[0];

    // Verify digital signature
    const isValid = this.verifyDigitalSignature(
      {
        certificateNumber: certificate.certificate_number,
        inspectionId: certificate.inspection_id,
        issueDate: certificate.issue_date.toISOString()
      },
      certificate.digital_signature
    );

    return {
      ...certificate,
      isValid,
      isExpired: new Date() > new Date(certificate.expiry_date)
    };
  }

  /**
   * List user certificates
   */
  async listUserCertificates(userId, limit = 20, offset = 0) {
    const result = await dbPool.query(
      `SELECT c.*, v.make, v.model, v.year, v.license_plate
      FROM certificates c
      LEFT JOIN vehicles v ON c.vehicle_id = v.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  /**
   * Revoke certificate
   */
  async revokeCertificate(certificateId, reason, correlationId) {
    const result = await dbPool.query(
      `UPDATE certificates 
      SET status = $1, revoked_at = NOW(), revocation_reason = $2
      WHERE id = $3
      RETURNING certificate_number`,
      ['revoked', reason, certificateId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Certificate not found');
    }

    logger.info('Certificate revoked', {
      correlationId,
      certificateId,
      reason
    });

    return result.rows[0];
  }

  /**
   * Get expiring certificates (for notifications)
   */
  async getExpiringCertificates(daysUntilExpiry = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

    const result = await dbPool.query(
      `SELECT c.*, u.email, u.first_name, u.last_name,
        v.make, v.model, v.license_plate
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN vehicles v ON c.vehicle_id = v.id
      WHERE c.status = 'active' 
      AND c.expiry_date <= $1 
      AND c.expiry_date > NOW()
      AND (c.expiry_notification_sent = FALSE OR c.expiry_notification_sent IS NULL)`,
      [expiryDate]
    );

    return result.rows;
  }

  /**
   * Mark expiry notification as sent
   */
  async markExpiryNotificationSent(certificateId) {
    await dbPool.query(
      'UPDATE certificates SET expiry_notification_sent = TRUE WHERE id = $1',
      [certificateId]
    );
  }
}

module.exports = new CertificateService();
