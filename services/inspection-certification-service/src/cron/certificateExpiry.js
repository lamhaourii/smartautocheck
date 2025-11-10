const cron = require('cron');
const certificateService = require('../services/certificate.service');
const { logger } = require('../config/logger');

/**
 * Cron job to check for expiring certificates and send notifications
 * Runs daily at 9:00 AM
 */
const certificateExpiryJob = new cron.CronJob(
  '0 9 * * *', // Every day at 9:00 AM
  async () => {
    logger.info('Running certificate expiry check...');

    try {
      // Get certificates expiring in 30 days
      const expiringCerts = await certificateService.getExpiringCertificates(30);

      logger.info(`Found ${expiringCerts.length} certificates expiring soon`);

      for (const cert of expiringCerts) {
        try {
          // TODO: Send notification via shared notification library
          // For now, just log
          logger.info('Certificate expiring soon', {
            certificateId: cert.id,
            certificateNumber: cert.certificate_number,
            userEmail: cert.email,
            expiryDate: cert.expiry_date
          });

          // Mark notification as sent
          await certificateService.markExpiryNotificationSent(cert.id);
        } catch (error) {
          logger.error('Failed to send expiry notification', {
            certificateId: cert.id,
            error: error.message
          });
        }
      }

      logger.info('Certificate expiry check completed');
    } catch (error) {
      logger.error('Certificate expiry job failed:', error);
    }
  },
  null,
  false,
  'America/New_York'
);

const startCronJobs = () => {
  certificateExpiryJob.start();
  logger.info('Certificate expiry cron job started');
};

const stopCronJobs = () => {
  certificateExpiryJob.stop();
  logger.info('Certificate expiry cron job stopped');
};

module.exports = {
  startCronJobs,
  stopCronJobs,
  certificateExpiryJob
};
