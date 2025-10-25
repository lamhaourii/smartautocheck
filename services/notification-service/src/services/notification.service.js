const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio
let twilioClient;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

class NotificationService {
  static async sendEmail(data) {
    const { recipient, subject, text, html, template } = data;

    if (!process.env.SENDGRID_API_KEY) {
      console.log('[MOCK EMAIL]', { recipient, subject, text });
      return { success: true, mock: true };
    }

    try {
      const msg = {
        to: recipient,
        from: process.env.FROM_EMAIL || 'noreply@smartautocheck.com',
        subject: subject || 'SmartAutoCheck Notification',
        text: text || '',
        html: html || text || ''
      };

      await sgMail.send(msg);
      console.log(`Email sent to ${recipient}`);
      return { success: true };
    } catch (error) {
      console.error('Email error:', error);
      throw error;
    }
  }

  static async sendSMS(data) {
    const { recipient, message } = data;

    if (!twilioClient) {
      console.log('[MOCK SMS]', { recipient, message });
      return { success: true, mock: true };
    }

    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: recipient
      });

      console.log(`SMS sent to ${recipient}`);
      return { success: true };
    } catch (error) {
      console.error('SMS error:', error);
      throw error;
    }
  }

  static async sendAppointmentConfirmation(data) {
    const { appointmentId, scheduledDate, serviceType } = data;
    
    console.log(`Sending appointment confirmation for ${appointmentId}`);
    
    // In production, fetch user email and send actual email
    return this.sendEmail({
      recipient: 'customer@example.com',
      subject: 'Appointment Confirmation - SmartAutoCheck',
      text: `Your appointment is confirmed for ${new Date(scheduledDate).toLocaleString()}. Service: ${serviceType}`
    });
  }

  static async sendPaymentReceipt(data) {
    const { paymentId, amount, currency } = data;
    
    console.log(`Sending payment receipt for ${paymentId}`);
    
    return this.sendEmail({
      recipient: 'customer@example.com',
      subject: 'Payment Receipt - SmartAutoCheck',
      text: `Payment received: ${currency} ${amount}. Transaction ID: ${paymentId}`
    });
  }

  static async sendCertificateReady(data) {
    const { certificateNumber, pdfUrl } = data;
    
    console.log(`Sending certificate ready notification for ${certificateNumber}`);
    
    return this.sendEmail({
      recipient: 'customer@example.com',
      subject: 'Your Inspection Certificate is Ready - SmartAutoCheck',
      text: `Your certificate ${certificateNumber} is ready. Download: ${pdfUrl}`
    });
  }
}

module.exports = NotificationService;
