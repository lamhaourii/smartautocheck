# @smartautocheck/notifications

Shared notification library for email and SMS communication across SmartAutoCheck services.

## Installation

```bash
npm install @smartautocheck/notifications
```

## Configuration

Set the following environment variables:

```env
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@smartautocheck.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Usage

### Email Notifications

```javascript
const {
  sendAppointmentConfirmation,
  sendPaymentReceipt,
  sendCertificateReady,
  sendPasswordReset
} = require('@smartautocheck/notifications');

// Send appointment confirmation
await sendAppointmentConfirmation('customer@example.com', {
  customerName: 'John Doe',
  appointmentDate: '2024-01-20',
  appointmentTime: '14:00',
  serviceType: 'Standard',
  vehicleInfo: '2020 Toyota Camry',
  appointmentUrl: 'https://smartautocheck.com/appointments/123'
});

// Send payment receipt
await sendPaymentReceipt('customer@example.com', {
  customerName: 'John Doe',
  transactionId: 'TXN-123456',
  paymentDate: '2024-01-15',
  serviceType: 'Standard',
  amount: '50.00',
  currency: 'USD',
  invoiceUrl: 'https://smartautocheck.com/invoices/123'
});

// Send certificate ready notification
await sendCertificateReady('customer@example.com', {
  customerName: 'John Doe',
  certificateNumber: 'CERT-202401-ABC123',
  vehicleInfo: '2020 Toyota Camry',
  issueDate: '2024-01-20',
  expiryDate: '2025-01-20',
  certificateUrl: 'https://smartautocheck.com/certificates/123',
  downloadUrl: 'https://smartautocheck.com/certificates/123/download'
});
```

### SMS Notifications

```javascript
const {
  sendAppointmentReminderSMS,
  sendVerificationCodeSMS
} = require('@smartautocheck/notifications');

// Send appointment reminder SMS
await sendAppointmentReminderSMS('+1234567890', {
  appointmentTime: '2:00 PM'
});

// Send verification code SMS
await sendVerificationCodeSMS('+1234567890', {
  code: '123456'
});
```

### Direct Service Access

For custom templates or advanced usage:

```javascript
const { emailService, smsService } = require('@smartautocheck/notifications');

// Send custom email
await emailService.send({
  to: 'user@example.com',
  subject: 'Custom Subject',
  template: '<h1>Hello {{name}}</h1>',
  data: { name: 'John' },
  attachments: [
    {
      filename: 'invoice.pdf',
      path: '/path/to/invoice.pdf'
    }
  ]
});

// Send custom SMS
await smsService.send({
  to: '+1234567890',
  template: 'Hello {{name}}!',
  data: { name: 'John' }
});
```

## Available Email Templates

- `appointmentConfirmation` - Sent when appointment is booked
- `appointmentReminder` - Sent 24 hours before appointment
- `paymentReceipt` - Sent when payment is successful
- `certificateReady` - Sent when certificate is generated
- `certificateExpiring` - Sent 30 days before expiry
- `passwordReset` - Sent for password reset requests
- `welcome` - Sent on user registration

## Available SMS Templates

- `appointmentReminder` - Appointment reminder
- `verificationCode` - OTP/verification code
- `certificateReady` - Certificate ready notification
- `certificateExpiring` - Expiry warning
- `appointmentConfirmation` - Booking confirmation
- `paymentConfirmation` - Payment success
- `inspectionComplete` - Inspection result

## Testing

```bash
npm test
```

## Features

- ✅ **Template-based**: Handlebars templating for dynamic content
- ✅ **SMTP Support**: Works with Gmail, SendGrid, or any SMTP provider
- ✅ **Twilio Integration**: SMS via Twilio API
- ✅ **Graceful Degradation**: SMS service optional (logs warning if not configured)
- ✅ **Bulk Sending**: Send multiple emails/SMS in batch
- ✅ **Attachments**: Support for email attachments
- ✅ **Error Handling**: Comprehensive error logging
- ✅ **Retry Logic**: Built-in retry for transient failures

## Error Handling

All notification methods throw errors on failure. Wrap in try-catch:

```javascript
try {
  await sendAppointmentConfirmation(email, data);
} catch (error) {
  console.error('Failed to send notification:', error);
  // Handle error (log, retry, etc.)
}
```

## License

MIT
