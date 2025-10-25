const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const { kafkaService } = require('../config/kafka');

class CertificateService {
  static generateCertificateNumber() {
    const prefix = 'CERT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  static generateDigitalSignature(data) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  static async generateCertificate(data) {
    try {
      const { inspectionId, appointmentId } = data;

      // Get inspection and appointment details
      const query = `
        SELECT 
          i.*,
          a.scheduled_date,
          v.registration_number, v.make, v.model, v.year, v.vin,
          u.first_name, u.last_name
        FROM inspections i
        JOIN appointments a ON i.appointment_id = a.id
        JOIN vehicles v ON a.vehicle_id = v.id
        JOIN users u ON a.user_id = u.id
        WHERE i.id = $1
      `;
      
      const result = await db.query(query, [inspectionId]);
      
      if (result.rows.length === 0) {
        throw new Error('Inspection not found');
      }

      const inspection = result.rows[0];
      const certificateNumber = this.generateCertificateNumber();
      const issueDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Valid for 1 year

      // Generate digital signature
      const signatureData = {
        certificateNumber,
        inspectionId,
        registrationNumber: inspection.registration_number,
        issueDate: issueDate.toISOString()
      };
      const digitalSignature = this.generateDigitalSignature(signatureData);

      // Generate PDF
      const pdfPath = await this.createPDF({
        certificateNumber,
        issueDate,
        expiryDate,
        inspection,
        digitalSignature
      });

      // Save certificate to database
      const insertQuery = `
        INSERT INTO certificates 
        (inspection_id, certificate_number, issue_date, expiry_date, pdf_url, digital_signature, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'valid')
        RETURNING *
      `;

      const insertResult = await db.query(insertQuery, [
        inspectionId,
        certificateNumber,
        issueDate,
        expiryDate,
        pdfPath,
        digitalSignature
      ]);

      const certificate = insertResult.rows[0];

      // Publish event
      const kafka = kafkaService();
      await kafka.publishEvent('certificates-topic', 'certificate.generated', {
        certificateId: certificate.id,
        inspectionId: certificate.inspection_id,
        certificateNumber: certificate.certificate_number,
        issueDate: certificate.issue_date,
        expiryDate: certificate.expiry_date,
        pdfUrl: certificate.pdf_url
      });

      // Notify customer
      await kafka.publishEvent('notifications-topic', 'notification.email', {
        recipient: `${inspection.first_name} ${inspection.last_name}`,
        template: 'certificate_ready',
        data: {
          certificateNumber: certificate.certificate_number,
          pdfUrl: certificate.pdf_url
        }
      });

      console.log(`Certificate generated: ${certificateNumber}`);
      return certificate;
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }
  }

  static async createPDF(data) {
    const { certificateNumber, issueDate, expiryDate, inspection, digitalSignature } = data;
    
    const dirPath = path.join(__dirname, '../../certificates');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filename = `${certificateNumber}.pdf`;
    const filepath = path.join(dirPath, filename);

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('TECHNICAL INSPECTION CERTIFICATE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text('SmartAutoCheck Inspection Center', { align: 'center' });
        doc.moveDown(2);

        // Certificate Number
        doc.fontSize(14).font('Helvetica-Bold').text(`Certificate No: ${certificateNumber}`);
        doc.moveDown();

        // Vehicle Information
        doc.fontSize(12).font('Helvetica-Bold').text('Vehicle Information:');
        doc.font('Helvetica');
        doc.text(`Registration Number: ${inspection.registration_number}`);
        doc.text(`Make: ${inspection.make}`);
        doc.text(`Model: ${inspection.model}`);
        doc.text(`Year: ${inspection.year}`);
        if (inspection.vin) doc.text(`VIN: ${inspection.vin}`);
        doc.moveDown();

        // Owner Information
        doc.font('Helvetica-Bold').text('Owner Information:');
        doc.font('Helvetica');
        doc.text(`Name: ${inspection.first_name} ${inspection.last_name}`);
        doc.moveDown();

        // Inspection Details
        doc.font('Helvetica-Bold').text('Inspection Details:');
        doc.font('Helvetica');
        doc.text(`Inspection Date: ${new Date(inspection.scheduled_date).toLocaleDateString()}`);
        doc.text(`Result: ${inspection.result.toUpperCase()}`);
        doc.moveDown();

        // Validity Period
        doc.font('Helvetica-Bold').text('Validity Period:');
        doc.font('Helvetica');
        doc.text(`Issue Date: ${issueDate.toLocaleDateString()}`);
        doc.text(`Expiry Date: ${expiryDate.toLocaleDateString()}`);
        doc.moveDown(2);

        // Generate QR Code
        const qrData = `CERT:${certificateNumber}:${digitalSignature}`;
        const qrCodeDataURL = await QRCode.toDataURL(qrData);
        const qrImage = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
        
        doc.image(qrImage, 450, 600, { width: 100 });
        doc.fontSize(8).text('Scan to verify', 465, 710);

        // Digital Signature
        doc.fontSize(8).text(`Digital Signature: ${digitalSignature.substring(0, 40)}...`, 50, 700);

        // Footer
        doc.fontSize(10).text('This certificate is valid only if the digital signature can be verified.', 50, 750, {
          align: 'center',
          width: 500
        });

        doc.end();

        stream.on('finish', () => {
          resolve(`/certificates/${filename}`);
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  static async verifyCertificate(certificateNumber, digitalSignature) {
    const query = 'SELECT * FROM certificates WHERE certificate_number = $1';
    const result = await db.query(query, [certificateNumber]);

    if (result.rows.length === 0) {
      return { valid: false, message: 'Certificate not found' };
    }

    const certificate = result.rows[0];

    if (certificate.digital_signature !== digitalSignature) {
      return { valid: false, message: 'Invalid digital signature' };
    }

    if (certificate.status !== 'valid') {
      return { valid: false, message: `Certificate status: ${certificate.status}` };
    }

    if (new Date() > new Date(certificate.expiry_date)) {
      return { valid: false, message: 'Certificate has expired' };
    }

    return { valid: true, certificate };
  }
}

module.exports = CertificateService;
