# Kafka Event Documentation - SmartAutoCheck

## Event-Driven Architecture Overview

SmartAutoCheck uses **Apache Kafka** as the central event streaming platform for asynchronous communication between microservices. This enables loose coupling, scalability, and fault tolerance.

### Benefits of Event-Driven Architecture
- ✅ **Loose Coupling**: Services don't need to know about each other
- ✅ **Scalability**: Services can process events at their own pace
- ✅ **Fault Tolerance**: Events are persisted, replay possible
- ✅ **Audit Trail**: Complete history of all domain events
- ✅ **Real-time Processing**: Immediate reaction to business events

---

## Kafka Topics

| Topic Name | Partitions | Retention | Description |
|------------|-----------|-----------|-------------|
| `appointments-topic` | 2 | 7 days | Appointment lifecycle events |
| `payments-topic` | 2 | 30 days | Payment and invoice events |
| `inspections-topic` | 2 | 7 days | Inspection workflow events |
| `certificates-topic` | 2 | 30 days | Certificate generation events |
| `notifications-topic` | 1 | 3 days | Notification dispatch events |
| `users-topic` | 1 | 7 days | User management events |

### Partitioning Strategy
- **appointments-topic**: Partitioned by `appointmentId` (even distribution)
- **payments-topic**: Partitioned by `appointmentId` (maintain order per appointment)
- **inspections-topic**: Partitioned by `inspectorId` (load per inspector)

---

## Event Catalog (15+ Events)

### 1. USER EVENTS (`users-topic`)

#### Event: `user.registered`
**Producer**: user-service  
**Consumers**: notification-service  
**Trigger**: User completes registration

**Schema**:
```json
{
  "eventType": "user.registered",
  "eventId": "uuid-v4",
  "timestamp": "2024-12-31T10:00:00Z",
  "version": "1.0",
  "data": {
    "userId": "user-uuid-123",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+33612345678",
    "role": "customer"
  }
}
```

**Business Rules**:
- Triggers welcome email
- Email verification link sent
- User profile created in cache

---

#### Event: `user.verified`
**Producer**: user-service  
**Consumers**: notification-service  
**Trigger**: User clicks email verification link

**Schema**:
```json
{
  "eventType": "user.verified",
  "eventId": "uuid-v4",
  "timestamp": "2024-12-31T10:05:00Z",
  "version": "1.0",
  "data": {
    "userId": "user-uuid-123",
    "email": "customer@example.com",
    "verifiedAt": "2024-12-31T10:05:00Z"
  }
}
```

**Business Rules**:
- User can now book appointments
- Confirmation email sent

---

### 2. APPOINTMENT EVENTS (`appointments-topic`)

#### Event: `appointment.created`
**Producer**: appointment-service  
**Consumers**: notification-service, payment-service  
**Trigger**: Customer books an appointment

**Schema**:
```json
{
  "eventType": "appointment.created",
  "eventId": "uuid-v4",
  "timestamp": "2024-12-31T10:00:00Z",
  "version": "1.0",
  "data": {
    "appointmentId": "appt-uuid-456",
    "customerId": "user-uuid-123",
    "serviceType": "premium",
    "date": "2025-01-15",
    "time": "10:00 AM",
    "vehicle": {
      "registration": "ABC-123-XY",
      "make": "Toyota",
      "model": "Camry",
      "year": 2020
    },
    "inspectorId": "inspector-uuid-789",
    "status": "pending_payment",
    "qrCode": "base64-encoded-qr-image",
    "amount": 80.00
  }
}
```

**Business Rules**:
- QR code generated with HMAC signature
- Slot is temporarily reserved (15 minutes)
- Confirmation email sent with QR code
- Payment window: 15 minutes

---

#### Event: `appointment.confirmed`
**Producer**: payment-service  
**Consumers**: appointment-service, inspection-service, notification-service  
**Trigger**: Payment successfully processed

**Schema**:
```json
{
  "eventType": "appointment.confirmed",
  "eventId": "uuid-v4",
  "timestamp": "2024-12-31T10:10:00Z",
  "version": "1.0",
  "data": {
    "appointmentId": "appt-uuid-456",
    "paymentId": "pay-uuid-789",
    "status": "confirmed",
    "confirmedAt": "2024-12-31T10:10:00Z"
  }
}
```

**Business Rules**:
- Slot permanently booked
- SMS reminder scheduled (24h before)
- Inspector assigned and notified
- Add to inspector's calendar

---

#### Event: `appointment.checkedin`
**Producer**: appointment-service  
**Consumers**: inspection-service, notification-service  
**Trigger**: Customer scans QR code at center

**Schema**:
```json
{
  "eventType": "appointment.checkedin",
  "eventId": "uuid-v4",
  "timestamp": "2025-01-15T09:55:00Z",
  "version": "1.0",
  "data": {
    "appointmentId": "appt-uuid-456",
    "checkedInAt": "2025-01-15T09:55:00Z",
    "location": {
      "centerId": "center-123",
      "address": "123 Main St"
    }
  }
}
```

**Business Rules**:
- QR code validated (signature, timestamp, not expired)
- Inspector receives notification
- Status updated to "in_progress"

---

#### Event: `appointment.cancelled`
**Producer**: appointment-service  
**Consumers**: payment-service, notification-service  
**Trigger**: Customer cancels appointment

**Schema**:
```json
{
  "eventType": "appointment.cancelled",
  "eventId": "uuid-v4",
  "timestamp": "2025-01-10T14:00:00Z",
  "version": "1.0",
  "data": {
    "appointmentId": "appt-uuid-456",
    "cancelledBy": "user-uuid-123",
    "reason": "Scheduling conflict",
    "cancelledAt": "2025-01-10T14:00:00Z",
    "refundEligible": true
  }
}
```

**Business Rules**:
- If >24h before appointment: Full refund
- If <24h: No refund
- Slot released back to availability
- Cancellation email sent

---

### 3. PAYMENT EVENTS (`payments-topic`)

#### Event: `payment.initiated`
**Producer**: payment-service  
**Consumers**: appointment-service  
**Trigger**: Customer clicks "Pay"

**Schema**:
```json
{
  "eventType": "payment.initiated",
  "eventId": "uuid-v4",
  "timestamp": "2024-12-31T10:08:00Z",
  "version": "1.0",
  "data": {
    "paymentId": "pay-uuid-789",
    "appointmentId": "appt-uuid-456",
    "amount": 80.00,
    "currency": "USD",
    "paypalOrderId": "5O190127TN364715T",
    "status": "pending"
  }
}
```

---

#### Event: `payment.completed`
**Producer**: payment-service  
**Consumers**: appointment-service, notification-service  
**Trigger**: PayPal payment captured successfully

**Schema**:
```json
{
  "eventType": "payment.completed",
  "eventId": "uuid-v4",
  "timestamp": "2024-12-31T10:10:00Z",
  "version": "1.0",
  "data": {
    "paymentId": "pay-uuid-789",
    "appointmentId": "appt-uuid-456",
    "amount": 80.00,
    "currency": "USD",
    "transactionId": "PAYPAL-CAPTURE-ID-123",
    "status": "completed",
    "completedAt": "2024-12-31T10:10:00Z",
    "paymentMethod": "paypal",
    "invoiceUrl": "https://s3.../invoices/invoice-123.pdf"
  }
}
```

**Business Rules**:
- Invoice PDF generated immediately
- Triggers appointment confirmation
- Receipt email sent with invoice attachment
- Idempotency key checked (prevent duplicate)

---

#### Event: `payment.failed`
**Producer**: payment-service  
**Consumers**: appointment-service, notification-service  
**Trigger**: PayPal payment declined

**Schema**:
```json
{
  "eventType": "payment.failed",
  "eventId": "uuid-v4",
  "timestamp": "2024-12-31T10:10:00Z",
  "version": "1.0",
  "data": {
    "paymentId": "pay-uuid-789",
    "appointmentId": "appt-uuid-456",
    "amount": 80.00,
    "status": "failed",
    "failureReason": "Insufficient funds",
    "failedAt": "2024-12-31T10:10:00Z"
  }
}
```

**Business Rules**:
- Appointment slot released after 15 minutes
- Customer notified to try again
- Failure logged for analytics

---

#### Event: `payment.refunded`
**Producer**: payment-service  
**Consumers**: appointment-service, notification-service  
**Trigger**: Admin issues refund or automatic refund after cancellation

**Schema**:
```json
{
  "eventType": "payment.refunded",
  "eventId": "uuid-v4",
  "timestamp": "2025-01-10T14:05:00Z",
  "version": "1.0",
  "data": {
    "paymentId": "pay-uuid-789",
    "refundId": "refund-uuid-999",
    "amount": 80.00,
    "reason": "Customer cancelled >24h before",
    "refundedAt": "2025-01-10T14:05:00Z"
  }
}
```

**Business Rules**:
- PayPal refund processed
- Customer notified
- Refund note on invoice

---

### 4. INSPECTION EVENTS (`inspections-topic`)

#### Event: `inspection.started`
**Producer**: inspection-service  
**Consumers**: notification-service, appointment-service  
**Trigger**: Inspector begins inspection (via WebSocket)

**Schema**:
```json
{
  "eventType": "inspection.started",
  "eventId": "uuid-v4",
  "timestamp": "2025-01-15T10:00:00Z",
  "version": "1.0",
  "data": {
    "inspectionId": "insp-uuid-111",
    "appointmentId": "appt-uuid-456",
    "inspectorId": "inspector-uuid-789",
    "startedAt": "2025-01-15T10:00:00Z",
    "checkpoints": [
      "brakes", "lights", "tires", "engine", 
      "suspension", "exhaust", "body", "interior", "documents"
    ]
  }
}
```

**Business Rules**:
- WebSocket notification to customer
- Real-time progress tracking
- Estimated completion: 30-45 minutes

---

#### Event: `inspection.checkpoint.completed`
**Producer**: inspection-service  
**Consumers**: notification-service (WebSocket broadcast)  
**Trigger**: Inspector marks checkpoint as complete

**Schema**:
```json
{
  "eventType": "inspection.checkpoint.completed",
  "eventId": "uuid-v4",
  "timestamp": "2025-01-15T10:05:00Z",
  "version": "1.0",
  "data": {
    "inspectionId": "insp-uuid-111",
    "checkpoint": "brakes",
    "status": "pass",
    "notes": "Brake pads at 70%, good condition",
    "photos": ["https://s3.../photos/brake-1.jpg"],
    "completedAt": "2025-01-15T10:05:00Z"
  }
}
```

**Business Rules**:
- Real-time update to customer dashboard
- Photos uploaded to S3
- If status "fail": Mark inspection as failed overall

---

#### Event: `inspection.completed`
**Producer**: inspection-service  
**Consumers**: certificate-service, notification-service  
**Trigger**: Inspector completes all checkpoints

**Schema**:
```json
{
  "eventType": "inspection.completed",
  "eventId": "uuid-v4",
  "timestamp": "2025-01-15T10:45:00Z",
  "version": "1.0",
  "data": {
    "inspectionId": "insp-uuid-111",
    "appointmentId": "appt-uuid-456",
    "result": "pass",
    "score": 95,
    "checkpoints": [
      {"name": "brakes", "status": "pass"},
      {"name": "lights", "status": "pass"},
      {"name": "tires", "status": "pass"},
      {"name": "engine", "status": "pass"},
      {"name": "suspension", "status": "pass"},
      {"name": "exhaust", "status": "pass"},
      {"name": "body", "status": "pass"},
      {"name": "interior", "status": "pass"},
      {"name": "documents", "status": "pass"}
    ],
    "completedAt": "2025-01-15T10:45:00Z",
    "duration": 45
  }
}
```

**Business Rules**:
- Triggers certificate generation (if passed)
- Customer notified immediately
- Inspection report PDF generated
- If failed: Recommendations provided

---

### 5. CERTIFICATE EVENTS (`certificates-topic`)

#### Event: `certificate.generated`
**Producer**: certificate-service  
**Consumers**: notification-service  
**Trigger**: Inspection passed

**Schema**:
```json
{
  "eventType": "certificate.generated",
  "eventId": "uuid-v4",
  "timestamp": "2025-01-15T10:46:00Z",
  "version": "1.0",
  "data": {
    "certificateId": "cert-uuid-222",
    "inspectionId": "insp-uuid-111",
    "appointmentId": "appt-uuid-456",
    "certificateNumber": "SAC-2025-001234",
    "qrCode": "base64-encoded-qr",
    "validUntil": "2026-01-15",
    "pdfUrl": "https://s3.../certificates/cert-222.pdf",
    "generatedAt": "2025-01-15T10:46:00Z"
  }
}
```

**Business Rules**:
- Valid for 1 year
- QR code for verification
- Legal disclaimer included
- Watermarked PDF
- Email sent to customer

---

#### Event: `certificate.verified`
**Producer**: certificate-service  
**Consumers**: None (logged for audit)  
**Trigger**: Someone scans QR code to verify certificate

**Schema**:
```json
{
  "eventType": "certificate.verified",
  "eventId": "uuid-v4",
  "timestamp": "2025-02-01T14:00:00Z",
  "version": "1.0",
  "data": {
    "certificateId": "cert-uuid-222",
    "verifiedBy": "ip:192.168.1.1",
    "verifiedAt": "2025-02-01T14:00:00Z",
    "valid": true
  }
}
```

---

### 6. NOTIFICATION EVENTS (`notifications-topic`)

#### Event: `notification.sent`
**Producer**: notification-service  
**Consumers**: None (logged for analytics)  
**Trigger**: Email or SMS successfully sent

**Schema**:
```json
{
  "eventType": "notification.sent",
  "eventId": "uuid-v4",
  "timestamp": "2024-12-31T10:11:00Z",
  "version": "1.0",
  "data": {
    "notificationId": "notif-uuid-333",
    "type": "email",
    "recipient": "customer@example.com",
    "subject": "Appointment Confirmation",
    "template": "appointment-confirmation",
    "status": "sent",
    "provider": "sendgrid",
    "providerMessageId": "msg-xyz-123",
    "sentAt": "2024-12-31T10:11:00Z"
  }
}
```

---

#### Event: `notification.failed`
**Producer**: notification-service  
**Consumers**: None (logged for retry)  
**Trigger**: Email/SMS delivery failed

**Schema**:
```json
{
  "eventType": "notification.failed",
  "eventId": "uuid-v4",
  "timestamp": "2024-12-31T10:11:00Z",
  "version": "1.0",
  "data": {
    "notificationId": "notif-uuid-333",
    "type": "email",
    "recipient": "invalid@email.com",
    "error": "Email address not found",
    "retryCount": 2,
    "failedAt": "2024-12-31T10:11:00Z"
  }
}
```

**Business Rules**:
- Retry up to 3 times with exponential backoff
- After 3 failures, mark as permanently failed
- Admin notified of critical notification failures

---

## Event Processing Patterns

### 1. At-Least-Once Delivery
- Kafka guarantees at-least-once delivery
- Consumers must be idempotent
- Use unique `eventId` to detect duplicates

### 2. Event Ordering
- Events in same partition are ordered
- Use partition key (appointmentId) to maintain order
- Out-of-order events handled via version field

### 3. Retry Strategy
- Failed processing: Retry 3 times with backoff
- After 3 failures: Move to dead letter queue
- Manual intervention required for DLQ

### 4. Event Versioning
- `version` field in all events
- Consumers handle multiple versions
- Gradual migration for breaking changes

---

## Consumer Groups

| Service | Consumer Group | Topics Subscribed | Processing |
|---------|---------------|-------------------|------------|
| notification-service | notifications-consumer | All topics | Async |
| certificate-service | certificates-consumer | inspections-topic | Async |
| payment-service | payments-consumer | appointments-topic | Async |
| appointment-service | appointments-consumer | payments-topic | Async |

---

## Monitoring & Debugging

### Kafka UI Access
http://localhost:8080

**Features**:
- Browse all topics and messages
- View consumer lag
- Inspect message schemas
- Monitor consumer groups
- Replay messages for testing

### Key Metrics to Monitor
- **Consumer Lag**: Time between message produced and consumed
- **Throughput**: Messages per second per topic
- **Error Rate**: Failed message processing
- **Partition Distribution**: Even load across partitions

### Debugging Commands

```bash
# List all topics
docker exec smartautocheck-kafka kafka-topics --list --bootstrap-server localhost:9092

# Consume messages from topic
docker exec smartautocheck-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic appointments-topic \
  --from-beginning

# Check consumer group status
docker exec smartautocheck-kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe \
  --group notifications-consumer
```

---

## Academic Significance

### Event-Driven Architecture Benefits Demonstrated:
1. **Loose Coupling**: Services communicate via events, not direct calls
2. **Scalability**: Services process events independently at their own pace
3. **Resilience**: Events persisted, can replay on failure
4. **Auditability**: Complete event log for compliance
5. **Flexibility**: Easy to add new consumers without changing producers

### Distributed Systems Concepts:
- **Eventual Consistency**: Data synchronized asynchronously
- **CQRS**: Command (write) and Query (read) separation
- **Event Sourcing**: State derived from event stream
- **Saga Pattern**: Distributed transactions via compensating events

---

## Summary

SmartAutoCheck implements a comprehensive event-driven architecture with:
- ✅ **15+ Domain Events** across 6 topics
- ✅ **4 Consumer Groups** processing events asynchronously
- ✅ **Idempotent Processing** with event deduplication
- ✅ **Monitoring & Debugging** via Kafka UI
- ✅ **Real-time Updates** via WebSocket + Kafka
- ✅ **Audit Trail** with complete event history

This event catalog serves as the contract between microservices, enabling independent development and deployment while maintaining system-wide consistency.
