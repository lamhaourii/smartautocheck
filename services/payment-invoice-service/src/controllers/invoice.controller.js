const invoiceService = require('../services/invoice.service');

class InvoiceController {
  async getInvoice(req, res, next) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user.userId;

      const invoice = await invoiceService.getInvoiceById(invoiceId, userId);

      res.status(200).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }

  async listInvoices(req, res, next) {
    try {
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const invoices = await invoiceService.getUserInvoices(userId, limit, offset);

      res.status(200).json({
        success: true,
        data: invoices,
        pagination: {
          limit,
          offset,
          total: invoices.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyInvoice(req, res, next) {
    try {
      const { invoiceNumber } = req.params;

      const invoice = await invoiceService.getInvoiceByNumber(invoiceNumber);

      res.status(200).json({
        success: true,
        data: {
          invoiceNumber: invoice.invoice_number,
          isValid: true,
          customerName: `${invoice.first_name} ${invoice.last_name}`,
          amount: invoice.amount,
          currency: invoice.currency,
          issueDate: invoice.created_at
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadInvoice(req, res, next) {
    try {
      const { invoiceId } = req.params;
      const userId = req.user.userId;

      const invoice = await invoiceService.getInvoiceById(invoiceId, userId);

      // In production, redirect to S3 URL or stream from storage
      res.status(200).json({
        success: true,
        message: 'Invoice download URL',
        data: {
          downloadUrl: `${process.env.API_GATEWAY_URL}/api/v1/invoices/${invoiceId}/download`,
          invoiceNumber: invoice.invoice_number
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InvoiceController();
