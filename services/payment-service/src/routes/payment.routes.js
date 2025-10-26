const express = require('express');
const PaymentController = require('../controllers/payment.controller');

const router = express.Router();

router.post('/create-order', PaymentController.createOrder);
router.post('/', PaymentController.processPayment);
router.get('/:id', PaymentController.getPayment);
router.post('/:id/refund', PaymentController.refundPayment);

module.exports = router;
