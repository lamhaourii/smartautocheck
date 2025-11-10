const EmailService = require('./services/email.service');
const SMSService = require('./services/sms.service');
const { emailTemplates } = require('./templates/email.templates');
const { smsTemplates } = require('./templates/sms.templates');

// Initialize services
const emailService = new EmailService({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  from: process.env.FROM_EMAIL || 'noreply@smartautocheck.com'
});

const smsService = new SMSService({
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_PHONE_NUMBER
});

/**
 * Send appointment confirmation email
 */
const sendAppointmentConfirmation = async (toEmail, data) => {
  return emailService.send({
    to: toEmail,
    subject: 'Appointment Confirmation - SmartAutoCheck',
    template: emailTemplates.appointmentConfirmation,
    data
  });
};

/**
 * Send appointment reminder email
 */
const sendAppointmentReminder = async (toEmail, data) => {
  return emailService.send({
    to: toEmail,
    subject: 'Appointment Reminder - SmartAutoCheck',
    template: emailTemplates.appointmentReminder,
    data
  });
};

/**
 * Send payment receipt email
 */
const sendPaymentReceipt = async (toEmail, data) => {
  return emailService.send({
    to: toEmail,
    subject: 'Payment Receipt - SmartAutoCheck',
    template: emailTemplates.paymentReceipt,
    data
  });
};

/**
 * Send certificate ready notification
 */
const sendCertificateReady = async (toEmail, data) => {
  return emailService.send({
    to: toEmail,
    subject: 'Your Certificate is Ready - SmartAutoCheck',
    template: emailTemplates.certificateReady,
    data
  });
};

/**
 * Send certificate expiry notification
 */
const sendCertificateExpiring = async (toEmail, data) => {
  return emailService.send({
    to: toEmail,
    subject: 'Certificate Expiring Soon - SmartAutoCheck',
    template: emailTemplates.certificateExpiring,
    data
  });
};

/**
 * Send password reset email
 */
const sendPasswordReset = async (toEmail, data) => {
  return emailService.send({
    to: toEmail,
    subject: 'Password Reset Request - SmartAutoCheck',
    template: emailTemplates.passwordReset,
    data
  });
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (toEmail, data) => {
  return emailService.send({
    to: toEmail,
    subject: 'Welcome to SmartAutoCheck!',
    template: emailTemplates.welcome,
    data
  });
};

/**
 * Send appointment reminder SMS
 */
const sendAppointmentReminderSMS = async (toPhone, data) => {
  return smsService.send({
    to: toPhone,
    template: smsTemplates.appointmentReminder,
    data
  });
};

/**
 * Send verification code SMS
 */
const sendVerificationCodeSMS = async (toPhone, data) => {
  return smsService.send({
    to: toPhone,
    template: smsTemplates.verificationCode,
    data
  });
};

module.exports = {
  // Email functions
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendPaymentReceipt,
  sendCertificateReady,
  sendCertificateExpiring,
  sendPasswordReset,
  sendWelcomeEmail,
  
  // SMS functions
  sendAppointmentReminderSMS,
  sendVerificationCodeSMS,
  
  // Direct service access if needed
  emailService,
  smsService
};
