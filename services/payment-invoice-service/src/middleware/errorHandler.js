const { logger } = require('../config/logger');

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message) {
    super(message, 401);
  }
}

class PaymentError extends AppError {
  constructor(message) {
    super(message, 402);
  }
}

const errorHandler = (err, req, res, next) => {
  const correlationId = req.correlationId;

  // Log error with context
  logger.error('Error occurred:', {
    correlationId,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const statusCode = err.statusCode || 500;
  
  const errorResponse = {
    success: false,
    error: {
      message: err.isOperational ? err.message : 'Internal server error',
      timestamp: err.timestamp || new Date().toISOString(),
      correlationId
    }
  };

  // Add stack trace in development
  if (isDevelopment && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = {
  errorHandler,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  PaymentError
};
