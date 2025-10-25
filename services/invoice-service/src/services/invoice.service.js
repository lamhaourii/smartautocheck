const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const { kafkaService } = require('../config/kafka');

class InvoiceService {
  static generateInvoiceNumber() {
    const prefix = 'INV';
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${prefix}-${year}${month}-${random}`;
  }

  static async generateInvoice(data) {
    try {
      const { paymentId, appointmentId, amount } = data;

      // Get payment and customer details
      const query = `
        SELECT 
          p.*,
          a.service_type,
          u.id as customer_id, u.email, u.first_name, u.last_name,
          v.registration_number
        FROM payments p
        JOIN appointments a ON p.appointment_id = a.id
        JOIN users u ON a.user_id = u.id
        JOIN vehicles v ON a.vehicle_id = v.id
        WHERE p.id = $1
      `;
      
      const result = await db.query(query, [paymentId]);
      
      if (result.rows.length === 0) {
        throw new Error('Payment not found');
      }

      const payment = result.rows[0];
      const invoiceNumber = this.generateInvoiceNumber();
      const tax = amount * 0.20; // 20% VAT
      const total = amount + tax;

      // Generate PDF
      const pdfPath = await this.createPDF({
        invoiceNumber,
        payment,
        amount,
        tax,
        total
      });

      // Save invoice to database
      const insertQuery = `
        INSERT INTO invoices 
        (payment_id, invoice_number, customer_id, amount, tax, total, status, pdf_url, issued_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'paid', $7, CURRENT_DATE)
        RETURNING *
      `;

      const insertResult = await db.query(insertQuery, [
        paymentId,
        invoiceNumber,
        payment.customer_id,
        amount,
        tax,
        total,
        pdfPath
      ]);

      const invoice = insertResult.rows[0];

      // Publish event
      const kafka = kafkaService();
      await kafka.publishEvent('invoices-topic', 'invoice.created', {
        invoiceId: invoice.id,
        paymentId: invoice.payment_id,
        customerId: invoice.customer_id,
        invoiceNumber: invoice.invoice_number,
        amount: invoice.amount,
        total: invoice.total,
        pdfUrl: invoice.pdf_url
      });

      console.log(`Invoice generated: ${invoiceNumber}`);
      return invoice;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }

  static async createPDF(data) {
    const { invoiceNumber, payment, amount, tax, total } = data;
    
    const dirPath = path.join(__dirname, '../../invoices');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filename = `${invoiceNumber}.pdf`;
    const filepath = path.join(dirPath, filename);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text('SmartAutoCheck Inspection Center', { align: 'center' });
        doc.moveDown(2);

        // Invoice Details
        doc.fontSize(12).font('Helvetica-Bold').text(`Invoice No: ${invoiceNumber}`);
        doc.font('Helvetica').text(`Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown();

        // Customer Details
        doc.font('Helvetica-Bold').text('Bill To:');
        doc.font('Helvetica');
        doc.text(`${payment.first_name} ${payment.last_name}`);
        doc.text(payment.email);
        doc.moveDown();

        // Service Details
        doc.font('Helvetica-Bold').text('Service Details:');
        doc.font('Helvetica');
        doc.text(`Service: ${payment.service_type}`);
        doc.text(`Vehicle: ${payment.registration_number}`);
        doc.moveDown(2);

        // Invoice Table
        const tableTop = 300;
        doc.font('Helvetica-Bold');
        doc.text('Description', 50, tableTop);
        doc.text('Amount', 400, tableTop, { width: 100, align: 'right' });
        
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        doc.font('Helvetica');
        doc.text(`Technical Inspection - ${payment.service_type}`, 50, tableTop + 25);
        doc.text(`$${amount.toFixed(2)}`, 400, tableTop + 25, { width: 100, align: 'right' });

        doc.text('VAT (20%)', 50, tableTop + 45);
        doc.text(`$${tax.toFixed(2)}`, 400, tableTop + 45, { width: 100, align: 'right' });

        doc.moveTo(50, tableTop + 65).lineTo(550, tableTop + 65).stroke();

        doc.font('Helvetica-Bold');
        doc.text('Total', 50, tableTop + 75);
        doc.text(`$${total.toFixed(2)}`, 400, tableTop + 75, { width: 100, align: 'right' });

        // Footer
        doc.fontSize(10).font('Helvetica').text('Thank you for your business!', 50, 700, {
          align: 'center',
          width: 500
        });

        doc.end();

        stream.on('finish', () => {
          resolve(`/invoices/${filename}`);
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = InvoiceService;
