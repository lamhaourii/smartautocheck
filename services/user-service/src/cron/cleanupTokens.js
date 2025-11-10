const cron = require('cron');
const UserModel = require('../models/user.model');

/**
 * Cron job to cleanup expired refresh tokens
 * Runs daily at 2:00 AM
 */
const cleanupTokensJob = new cron.CronJob(
  '0 2 * * *', // Every day at 2:00 AM
  async () => {
    console.log('Running expired tokens cleanup...');

    try {
      await UserModel.cleanupExpiredTokens();
      console.log('Expired tokens cleaned up successfully');
    } catch (error) {
      console.error('Failed to cleanup expired tokens:', error);
    }
  },
  null,
  false,
  'America/New_York'
);

const startCronJobs = () => {
  cleanupTokensJob.start();
  console.log('Token cleanup cron job started');
};

const stopCronJobs = () => {
  cleanupTokensJob.stop();
  console.log('Token cleanup cron job stopped');
};

module.exports = {
  startCronJobs,
  stopCronJobs,
  cleanupTokensJob
};
