const express = require('express');
const InvoiceController = require('../controllers/invoice.controller');

const router = express.Router();

router.post('/', InvoiceController.createInvoice);
router.get('/:id', InvoiceController.getInvoice);
router.get('/customer/:customerId', InvoiceController.getCustomerInvoices);

module.exports = router;
