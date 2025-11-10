const smsTemplates = {
  appointmentReminder: `SmartAutoCheck Reminder: Your vehicle inspection is tomorrow at {{appointmentTime}}. Location: SmartAutoCheck Technical Center. Please arrive 10 minutes early.`,

  verificationCode: `Your SmartAutoCheck verification code is: {{code}}. Valid for 10 minutes. Do not share this code.`,

  certificateReady: `Great news! Your vehicle inspection certificate #{{certificateNumber}} is ready. Download it at {{certificateUrl}}`,

  certificateExpiring: `Your inspection certificate expires in {{daysRemaining}} days ({{expiryDate}}). Book a new inspection at {{bookingUrl}}`,

  appointmentConfirmation: `Your inspection appointment is confirmed for {{appointmentDate}} at {{appointmentTime}}. Appointment ID: {{appointmentId}}`,

  paymentConfirmation: `Payment received! Amount: {{amount}} {{currency}}. Your inspection is now unlocked. Thank you!`,

  inspectionComplete: `Your vehicle inspection is complete. Result: {{result}}. {{certificateAvailable ? 'Certificate available for download.' : 'Please contact us for next steps.'}}`
};

module.exports = { smsTemplates };
