const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { dbPool } = require('../config/database');
const { logger } = require('../config/logger');
const { metrics } = require('../middleware/metrics');
const { NotFoundError } = require('../middleware/errorHandler');

class InvoiceService {
  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${year}${month}-${timestamp}`;
  }

  async createInvoice(paymentId, correlationId) {
    try {
      // Get payment and related data
      const result = await dbPool.query(
        `SELECT 
          p.*,
          a.scheduled_date, a.service_type, a.vehicle_id,
          u.email, u.first_name, u.last_name, u.phone,
          v.make, v.model, v.year, v.license_plate
        FROM payments p
        JOIN appointments a ON p.appointment_id = a.id
        JOIN users u ON p.user_id = u.id
        LEFT JOIN vehicles v ON a.vehicle_id = v.id
        WHERE p.id = $1`,
        [paymentId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Payment not found');
      }

      const data = result.rows[0];

      // Check if invoice already exists
      const existingInvoice = await dbPool.query(
        'SELECT id FROM invoices WHERE payment_id = $1',
        [paymentId]
      );

      if (existingInvoice.rows.length > 0) {
        logger.info('Invoice already exists', { correlationId, paymentId });
        return existingInvoice.rows[0].id;
      }

      // Create invoice record
      const invoiceId = uuidv4();
      const invoiceNumber = this.generateInvoiceNumber();

      await dbPool.query(
        `INSERT INTO invoices 
        (id, invoice_number, payment_id, appointment_id, user_id, amount, currency, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [invoiceId, invoiceNumber, paymentId, data.appointment_id, data.user_id, data.amount, data.currency, 'generated']
      );

      // Generate PDF (stored as buffer, in production save to S3/storage)
      const pdfBuffer = await this.generateInvoicePDF({
        invoiceId,
        invoiceNumber,
        customerName: `${data.first_name} ${data.last_name}`,
        customerEmail: data.email,
        customerPhone: data.phone,
        vehicleInfo: `${data.year} ${data.make} ${data.model} (${data.license_plate})`,
        serviceType: data.service_type,
        amount: data.amount,
        currency: data.currency,
        paymentDate: data.captured_at,
        transactionId: data.paypal_capture_id
      });

      // In production, upload PDF to cloud storage
      // For now, we'll store the path reference
      await dbPool.query(
        'UPDATE invoices SET pdf_path = $1, updated_at = NOW() WHERE id = $2',
        [`/invoices/${invoiceNumber}.pdf`, invoiceId]
      );

      metrics.invoicesGenerated.inc({ status: 'success' });

      logger.info('Invoice created successfully', {
        correlationId,
        invoiceId,
        invoiceNumber,
        paymentId
      });

      return invoiceId;
    } catch (error) {
      metrics.invoicesGenerated.inc({ status: 'failed' });
      logger.error('Failed to create invoice', { correlationId, error: error.message });
      throw error;
    }
  }

  async generateInvoicePDF(data) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('SMARTAUTOCHECK', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('Vehicle Technical Inspection Service', { align: 'center' });
        doc.moveDown();

        // Invoice title
        doc.fontSize(18).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
        doc.moveDown();

        // Invoice details
        doc.fontSize(10).font('Helvetica');
        doc.text(`Invoice Number: ${data.invoiceNumber}`, 50, 150);
        doc.text(`Date: ${new Date(data.paymentDate).toLocaleDateString()}`, 50, 165);
        doc.text(`Transaction ID: ${data.transactionId}`, 50, 180);

        // Customer details
        doc.fontSize(12).font('Helvetica-Bold').text('BILL TO:', 50, 220);
        doc.fontSize(10).font('Helvetica');
        doc.text(data.customerName, 50, 240);
        doc.text(data.customerEmail, 50, 255);
        doc.text(data.customerPhone, 50, 270);

        // Vehicle details
        doc.fontSize(12).font('Helvetica-Bold').text('VEHICLE:', 50, 310);
        doc.fontSize(10).font('Helvetica');
        doc.text(data.vehicleInfo, 50, 330);

        // Service details table
        doc.fontSize(12).font('Helvetica-Bold').text('SERVICES:', 50, 370);
        
        const tableTop = 395;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Description', 50, tableTop);
        doc.text('Amount', 400, tableTop, { width: 100, align: 'right' });

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        doc.font('Helvetica');
        doc.text(`Vehicle Inspection - ${data.serviceType}`, 50, tableTop + 25);
        doc.text(`${data.currency} ${data.amount.toFixed(2)}`, 400, tableTop + 25, { width: 100, align: 'right' });

        // Total
        const totalTop = tableTop + 60;
        doc.moveTo(50, totalTop).lineTo(550, totalTop).stroke();
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('TOTAL:', 50, totalTop + 10);
        doc.text(`${data.currency} ${data.amount.toFixed(2)}`, 400, totalTop + 10, { width: 100, align: 'right' });

        // Generate QR code for verification
        const qrCodeData = `${process.env.FRONTEND_URL}/invoices/${data.invoiceId}/verify`;
        const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, { width: 100 });
        doc.image(qrCodeBuffer, 50, totalTop + 50, { width: 100 });

        doc.fontSize(8).font('Helvetica').text('Scan to verify invoice', 50, totalTop + 160);

        // Footer
        doc.fontSize(8).text(
          'Thank you for choosing SmartAutoCheck!',
          50,
          700,
          { align: 'center', width: 500 }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  async getInvoiceById(invoiceId, userId) {
    const result = await dbPool.query(
      `SELECT i.*, p.amount, p.currency, p.captured_at,
        a.scheduled_date, a.service_type
      FROM invoices i
      JOIN payments p ON i.payment_id = p.id
      JOIN appointments a ON i.appointment_id = a.id
      WHERE i.id = $1 AND i.user_id = $2`,
      [invoiceId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Invoice not found');
    }

    return result.rows[0];
  }

  async getUserInvoices(userId, limit = 20, offset = 0) {
    const result = await dbPool.query(
      `SELECT i.*, p.amount, p.currency, p.captured_at,
        a.scheduled_date, a.service_type
      FROM invoices i
      JOIN payments p ON i.payment_id = p.id
      JOIN appointments a ON i.appointment_id = a.id
      WHERE i.user_id = $1
      ORDER BY i.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  async getInvoiceByNumber(invoiceNumber) {
    const result = await dbPool.query(
      `SELECT i.*, p.amount, p.currency, u.first_name, u.last_name, u.email
      FROM invoices i
      JOIN payments p ON i.payment_id = p.id
      JOIN users u ON i.user_id = u.id
      WHERE i.invoice_number = $1`,
      [invoiceNumber]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Invoice not found');
    }

    return result.rows[0];
  }
}

module.exports = new InvoiceService();
