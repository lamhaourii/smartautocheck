// Event Schema Definitions for SmartAutoCheck

// Appointment Events
const AppointmentCreatedEvent = {
  eventType: 'appointment.created',
  schema: {
    appointmentId: 'string (uuid)',
    userId: 'string (uuid)',
    vehicleId: 'string (uuid)',
    scheduledDate: 'string (ISO-8601)',
    serviceType: 'string',
    status: 'string'
  }
};

const AppointmentUpdatedEvent = {
  eventType: 'appointment.updated',
  schema: {
    appointmentId: 'string (uuid)',
    updates: 'object',
    previousStatus: 'string',
    newStatus: 'string'
  }
};

const AppointmentCancelledEvent = {
  eventType: 'appointment.cancelled',
  schema: {
    appointmentId: 'string (uuid)',
    userId: 'string (uuid)',
    reason: 'string',
    cancelledAt: 'string (ISO-8601)'
  }
};

// Payment Events
const PaymentCompletedEvent = {
  eventType: 'payment.completed',
  schema: {
    paymentId: 'string (uuid)',
    appointmentId: 'string (uuid)',
    amount: 'number',
    currency: 'string',
    paymentMethod: 'string',
    transactionId: 'string'
  }
};

const PaymentFailedEvent = {
  eventType: 'payment.failed',
  schema: {
    paymentId: 'string (uuid)',
    appointmentId: 'string (uuid)',
    amount: 'number',
    errorCode: 'string',
    errorMessage: 'string'
  }
};

// Document Events
const DocumentProcessedEvent = {
  eventType: 'document.processed',
  schema: {
    documentId: 'string (uuid)',
    userId: 'string (uuid)',
    extractedData: 'object',
    confidence: 'number',
    processedAt: 'string (ISO-8601)'
  }
};

// Inspection Events
const InspectionStartedEvent = {
  eventType: 'inspection.started',
  schema: {
    inspectionId: 'string (uuid)',
    appointmentId: 'string (uuid)',
    inspectorId: 'string (uuid)',
    startedAt: 'string (ISO-8601)'
  }
};

const InspectionCompletedEvent = {
  eventType: 'inspection.completed',
  schema: {
    inspectionId: 'string (uuid)',
    appointmentId: 'string (uuid)',
    result: 'string (pass/fail/conditional)',
    checkpoints: 'array',
    notes: 'string',
    completedAt: 'string (ISO-8601)'
  }
};

// Certificate Events
const CertificateGeneratedEvent = {
  eventType: 'certificate.generated',
  schema: {
    certificateId: 'string (uuid)',
    inspectionId: 'string (uuid)',
    certificateNumber: 'string',
    issueDate: 'string (ISO-8601)',
    expiryDate: 'string (ISO-8601)',
    pdfUrl: 'string'
  }
};

// Invoice Events
const InvoiceCreatedEvent = {
  eventType: 'invoice.created',
  schema: {
    invoiceId: 'string (uuid)',
    paymentId: 'string (uuid)',
    customerId: 'string (uuid)',
    invoiceNumber: 'string',
    amount: 'number',
    total: 'number',
    pdfUrl: 'string'
  }
};

// Notification Events
const NotificationEmailEvent = {
  eventType: 'notification.email',
  schema: {
    recipient: 'string (email)',
    subject: 'string',
    template: 'string',
    data: 'object',
    priority: 'string (low/normal/high)'
  }
};

const NotificationSMSEvent = {
  eventType: 'notification.sms',
  schema: {
    recipient: 'string (phone)',
    message: 'string',
    priority: 'string (low/normal/high)'
  }
};

// Export all schemas
module.exports = {
  AppointmentCreatedEvent,
  AppointmentUpdatedEvent,
  AppointmentCancelledEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  DocumentProcessedEvent,
  InspectionStartedEvent,
  InspectionCompletedEvent,
  CertificateGeneratedEvent,
  InvoiceCreatedEvent,
  NotificationEmailEvent,
  NotificationSMSEvent
};
