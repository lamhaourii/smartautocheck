const twilio = require('twilio');
const Handlebars = require('handlebars');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'sms-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class SMSService {
  constructor(config) {
    if (!config.accountSid || !config.authToken) {
      logger.warn('Twilio credentials not configured, SMS service disabled');
      this.enabled = false;
      return;
    }

    this.client = twilio(config.accountSid, config.authToken);
    this.fromNumber = config.fromNumber;
    this.enabled = true;

    logger.info('SMS service initialized');
  }

  /**
   * Send SMS with template
   */
  async send({ to, template, data }) {
    if (!this.enabled) {
      logger.warn('SMS service disabled, skipping message');
      return { success: false, message: 'SMS service not configured' };
    }

    try {
      // Compile template
      const compiledTemplate = Handlebars.compile(template);
      const body = compiledTemplate(data);

      // Send SMS
      const message = await this.client.messages.create({
        body,
        from: this.fromNumber,
        to
      });

      logger.info('SMS sent successfully', {
        to,
        sid: message.sid
      });

      return {
        success: true,
        sid: message.sid
      };
    } catch (error) {
      logger.error('Failed to send SMS:', {
        to,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulk(messages) {
    if (!this.enabled) {
      return messages.map(msg => ({
        ...msg,
        success: false,
        message: 'SMS service not configured'
      }));
    }

    const results = [];
    
    for (const msg of messages) {
      try {
        const result = await this.send(msg);
        results.push({ ...msg, success: true, ...result });
      } catch (error) {
        results.push({ ...msg, success: false, error: error.message });
      }
    }

    return results;
  }
}

module.exports = SMSService;
