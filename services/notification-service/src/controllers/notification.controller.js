const NotificationService = require('../services/notification.service');

class NotificationController {
  static async sendNotification(req, res, next) {
    try {
      const { type, recipient, message, subject } = req.body;

      if (!type || !recipient || !message) {
        return res.status(400).json({ 
          success: false, 
          message: 'Type, recipient, and message are required' 
        });
      }

      let result;
      if (type === 'email') {
        result = await NotificationService.sendEmail({
          recipient,
          subject: subject || 'SmartAutoCheck Notification',
          text: message
        });
      } else if (type === 'sms') {
        result = await NotificationService.sendSMS({
          recipient,
          message
        });
      } else {
        return res.status(400).json({ success: false, message: 'Invalid notification type' });
      }

      res.json({
        success: true,
        message: 'Notification sent successfully',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = NotificationController;
