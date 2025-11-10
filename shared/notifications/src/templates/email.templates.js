const emailTemplates = {
  appointmentConfirmation: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2563eb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Confirmed</h1>
        </div>
        <div class="content">
          <p>Hello {{customerName}},</p>
          <p>Your vehicle inspection appointment has been confirmed!</p>
          
          <div class="details">
            <h3>Appointment Details</h3>
            <p><strong>Date:</strong> {{appointmentDate}}</p>
            <p><strong>Time:</strong> {{appointmentTime}}</p>
            <p><strong>Service:</strong> {{serviceType}}</p>
            <p><strong>Vehicle:</strong> {{vehicleInfo}}</p>
            <p><strong>Location:</strong> SmartAutoCheck Technical Center</p>
          </div>
          
          <p>Please arrive 10 minutes early for check-in.</p>
          
          <a href="{{appointmentUrl}}" class="button">View Appointment</a>
        </div>
        <div class="footer">
          <p>SmartAutoCheck - Vehicle Technical Inspection Service</p>
          <p>If you need to reschedule, please contact us at support@smartautocheck.com</p>
        </div>
      </div>
    </body>
    </html>
  `,

  appointmentReminder: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #fffbeb; }
        .highlight { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f59e0b; }
        .button { display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reminder: Appointment Tomorrow</h1>
        </div>
        <div class="content">
          <p>Hello {{customerName}},</p>
          <p>This is a friendly reminder about your vehicle inspection appointment tomorrow.</p>
          
          <div class="highlight">
            <h3>Appointment Details</h3>
            <p><strong>Date:</strong> {{appointmentDate}}</p>
            <p><strong>Time:</strong> {{appointmentTime}}</p>
            <p><strong>Vehicle:</strong> {{vehicleInfo}}</p>
          </div>
          
          <p><strong>What to bring:</strong></p>
          <ul>
            <li>Vehicle registration documents</li>
            <li>Driver's license</li>
            <li>Previous inspection certificate (if applicable)</li>
          </ul>
          
          <a href="{{appointmentUrl}}" class="button">View Details</a>
        </div>
        <div class="footer">
          <p>SmartAutoCheck - Vehicle Technical Inspection Service</p>
        </div>
      </div>
    </body>
    </html>
  `,

  paymentReceipt: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f0fdf4; }
        .receipt { background-color: white; padding: 20px; margin: 15px 0; border: 1px solid #d1d5db; }
        .total { font-size: 24px; color: #10b981; font-weight: bold; }
        .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Payment Successful</h1>
        </div>
        <div class="content">
          <p>Hello {{customerName}},</p>
          <p>Thank you for your payment. Your transaction has been processed successfully.</p>
          
          <div class="receipt">
            <h3>Payment Receipt</h3>
            <p><strong>Transaction ID:</strong> {{transactionId}}</p>
            <p><strong>Date:</strong> {{paymentDate}}</p>
            <p><strong>Service:</strong> {{serviceType}} Inspection</p>
            <p><strong>Amount:</strong> <span class="total">{{amount}} {{currency}}</span></p>
          </div>
          
          <p>Your inspection is now unlocked and will be performed as scheduled.</p>
          
          <a href="{{invoiceUrl}}" class="button">Download Invoice</a>
        </div>
        <div class="footer">
          <p>SmartAutoCheck - Vehicle Technical Inspection Service</p>
        </div>
      </div>
    </body>
    </html>
  `,

  certificateReady: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #faf5ff; }
        .certificate { background-color: white; padding: 20px; margin: 15px 0; border: 2px solid #8b5cf6; text-align: center; }
        .button { display: inline-block; padding: 12px 24px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin: 10px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Your Certificate is Ready!</h1>
        </div>
        <div class="content">
          <p>Hello {{customerName}},</p>
          <p>Great news! Your vehicle has passed inspection and your certificate is ready.</p>
          
          <div class="certificate">
            <h2>Certificate Details</h2>
            <p><strong>Certificate Number:</strong> {{certificateNumber}}</p>
            <p><strong>Vehicle:</strong> {{vehicleInfo}}</p>
            <p><strong>Issue Date:</strong> {{issueDate}}</p>
            <p><strong>Expiry Date:</strong> {{expiryDate}}</p>
          </div>
          
          <p style="text-align: center;">
            <a href="{{certificateUrl}}" class="button">View Certificate</a>
            <a href="{{downloadUrl}}" class="button">Download PDF</a>
          </p>
        </div>
        <div class="footer">
          <p>SmartAutoCheck - Vehicle Technical Inspection Service</p>
          <p>Valid for one year from issue date</p>
        </div>
      </div>
    </body>
    </html>
  `,

  certificateExpiring: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #fef2f2; }
        .warning { background-color: #fee2e2; padding: 15px; margin: 15px 0; border-left: 4px solid #ef4444; }
        .button { display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠ Certificate Expiring Soon</h1>
        </div>
        <div class="content">
          <p>Hello {{customerName}},</p>
          <p>Your vehicle inspection certificate will expire soon.</p>
          
          <div class="warning">
            <p><strong>Certificate Number:</strong> {{certificateNumber}}</p>
            <p><strong>Vehicle:</strong> {{vehicleInfo}}</p>
            <p><strong>Expiry Date:</strong> {{expiryDate}}</p>
            <p><strong>Days Remaining:</strong> {{daysRemaining}}</p>
          </div>
          
          <p>Schedule a new inspection to avoid any penalties or driving restrictions.</p>
          
          <a href="{{bookingUrl}}" class="button">Book New Inspection</a>
        </div>
        <div class="footer">
          <p>SmartAutoCheck - Vehicle Technical Inspection Service</p>
        </div>
      </div>
    </body>
    </html>
  `,

  passwordReset: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #6366f1; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #eef2ff; }
        .code-box { background-color: white; padding: 20px; margin: 15px 0; text-align: center; border: 2px dashed #6366f1; }
        .code { font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; }
        .warning { background-color: #fef3c7; padding: 10px; margin: 15px 0; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello {{customerName}},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <p style="text-align: center;">
            <a href="{{resetUrl}}" class="button">Reset Password</a>
          </p>
          
          <div class="warning">
            <p><strong>⏰ This link expires in 1 hour</strong></p>
          </div>
          
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>SmartAutoCheck - Vehicle Technical Inspection Service</p>
          <p>For security reasons, never share this link with anyone</p>
        </div>
      </div>
    </body>
    </html>
  `,

  welcome: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0ea5e9; color: white; padding: 30px; text-align: center; }
        .content { padding: 20px; background-color: #f0f9ff; }
        .features { background-color: white; padding: 20px; margin: 15px 0; }
        .feature { margin: 10px 0; padding-left: 25px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to SmartAutoCheck!</h1>
        </div>
        <div class="content">
          <p>Hello {{customerName}},</p>
          <p>Thank you for registering with SmartAutoCheck! We're excited to help you keep your vehicle safe and compliant.</p>
          
          <div class="features">
            <h3>What you can do:</h3>
            <div class="feature">✓ Book vehicle inspections online</div>
            <div class="feature">✓ Track inspection status in real-time</div>
            <div class="feature">✓ Download certificates instantly</div>
            <div class="feature">✓ Receive expiry reminders</div>
            <div class="feature">✓ Access payment history</div>
          </div>
          
          <p>Ready to get started?</p>
          
          <p style="text-align: center;">
            <a href="{{dashboardUrl}}" class="button">Go to Dashboard</a>
          </p>
        </div>
        <div class="footer">
          <p>SmartAutoCheck - Vehicle Technical Inspection Service</p>
          <p>Need help? Contact us at support@smartautocheck.com</p>
        </div>
      </div>
    </body>
    </html>
  `
};

module.exports = { emailTemplates };
