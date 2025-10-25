// Common utilities and helpers

// Error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
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

class ForbiddenError extends AppError {
  constructor(message) {
    super(message, 403);
  }
}

// Response helpers
const successResponse = (data, message = 'Success') => ({
  success: true,
  message,
  data
});

const errorResponse = (message, errors = null) => ({
  success: false,
  message,
  errors
});

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Pagination helper
const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { offset, limit: parseInt(limit) };
};

const paginatedResponse = (data, page, limit, total) => ({
  success: true,
  data,
  pagination: {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / limit)
  }
});

// Date helpers
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const addYears = (date, years) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

// Validation helpers
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

// Random generators
const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

const generateCertificateNumber = () => {
  const prefix = 'CERT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const generateInvoiceNumber = () => {
  const prefix = 'INV';
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}-${year}${month}-${random}`;
};

// Logger helper
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() }));
  },
  error: (message, error = {}, meta = {}) => {
    console.error(JSON.stringify({ 
      level: 'error', 
      message, 
      error: error.message || error, 
      stack: error.stack,
      ...meta, 
      timestamp: new Date().toISOString() 
    }));
  },
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...meta, timestamp: new Date().toISOString() }));
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(JSON.stringify({ level: 'debug', message, ...meta, timestamp: new Date().toISOString() }));
    }
  }
};

// Rate limiting helper
const createRateLimiter = (windowMs, maxRequests) => {
  const requests = new Map();
  
  return (identifier) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, timestamps] of requests.entries()) {
      const filtered = timestamps.filter(t => t > windowStart);
      if (filtered.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, filtered);
      }
    }
    
    // Check current identifier
    const userRequests = requests.get(identifier) || [];
    const recentRequests = userRequests.filter(t => t > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    requests.set(identifier, recentRequests);
    return true;
  };
};

module.exports = {
  // Errors
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  
  // Response helpers
  successResponse,
  errorResponse,
  asyncHandler,
  
  // Pagination
  paginate,
  paginatedResponse,
  
  // Date helpers
  addDays,
  addMonths,
  addYears,
  
  // Validation
  validateEmail,
  validatePhone,
  
  // Generators
  generateId,
  generateCertificateNumber,
  generateInvoiceNumber,
  
  // Logger
  logger,
  
  // Rate limiting
  createRateLimiter
};
