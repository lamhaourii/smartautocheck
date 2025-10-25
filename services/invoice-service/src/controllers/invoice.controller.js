const db = require('../config/database');
const InvoiceService = require('../services/invoice.service');

class InvoiceController {
  static async createInvoice(req, res, next) {
    try {
      const { paymentId, appointmentId, amount } = req.body;

      if (!paymentId || !amount) {
        return res.status(400).json({ success: false, message: 'Payment ID and amount required' });
      }

      const invoice = await InvoiceService.generateInvoice({ paymentId, appointmentId, amount });

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice
      });
    } catch (err) {
      next(err);
    }
  }

  static async getInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const query = 'SELECT * FROM invoices WHERE id = $1';
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }

  static async getCustomerInvoices(req, res, next) {
    try {
      const { customerId } = req.params;
      const query = 'SELECT * FROM invoices WHERE customer_id = $1 ORDER BY created_at DESC';
      const result = await db.query(query, [customerId]);

      res.json({ success: true, data: result.rows });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = InvoiceController;
