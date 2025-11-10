const Joi = require('joi');

const createPaymentSchema = Joi.object({
  appointmentId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().valid('USD', 'EUR', 'GBP').default('USD'),
  paymentMethod: Joi.string().valid('paypal', 'credit_card').default('paypal'),
  returnUrl: Joi.string().uri().optional(),
  cancelUrl: Joi.string().uri().optional()
});

const capturePaymentSchema = Joi.object({
  orderId: Joi.string().required()
});

const refundPaymentSchema = Joi.object({
  paymentId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(2).optional(),
  reason: Joi.string().max(500).optional()
});

const validateCreatePayment = (req, res, next) => {
  const { error } = createPaymentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: error.details.map(d => d.message)
      }
    });
  }
  next();
};

const validateCapturePayment = (req, res, next) => {
  const { error } = capturePaymentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: error.details.map(d => d.message)
      }
    });
  }
  next();
};

const validateRefundPayment = (req, res, next) => {
  const { error } = refundPaymentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: error.details.map(d => d.message)
      }
    });
  }
  next();
};

module.exports = {
  validateCreatePayment,
  validateCapturePayment,
  validateRefundPayment
};
