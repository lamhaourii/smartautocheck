const nodemailer = require('nodemailer');
const Handlebars = require('handlebars');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'email-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class EmailService {
  constructor(config) {
    this.from = config.from;
    
    // Create transporter
    this.transporter = nodemailer.createTransporter({
      host: config.host || 'smtp.gmail.com',
      port: config.port || 587,
      secure: config.secure || false,
      auth: config.auth
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        logger.error('Email transporter verification failed:', error);
      } else {
        logger.info('Email transporter ready');
      }
    });
  }

  /**
   * Send email with template
   */
  async send({ to, subject, template, data, attachments = [] }) {
    try {
      // Compile template
      const compiledTemplate = Handlebars.compile(template);
      const html = compiledTemplate(data);

      // Send email
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        attachments
      });

      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: info.messageId
      });

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      logger.error('Failed to send email:', {
        to,
        subject,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulk(emails) {
    const results = [];
    
    for (const email of emails) {
      try {
        const result = await this.send(email);
        results.push({ ...email, success: true, ...result });
      } catch (error) {
        results.push({ ...email, success: false, error: error.message });
      }
    }

    return results;
  }
}

module.exports = EmailService;
