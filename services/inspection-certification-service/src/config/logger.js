const winston = require('winston');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'inspection-certification-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
          let log = `${timestamp} [${level}]`;
          if (correlationId) log += ` [${correlationId}]`;
          log += `: ${message}`;
          if (Object.keys(meta).length && meta.service !== 'inspection-certification-service') {
            log += ` ${JSON.stringify(meta)}`;
          }
          return log;
        })
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: logFormat
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: logFormat
    })
  ]
});

module.exports = { logger };
