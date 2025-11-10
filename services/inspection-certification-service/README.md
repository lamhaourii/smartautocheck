# Inspection & Certification Service

Consolidated microservice handling vehicle inspections with checkpoints and automatic certificate generation with PDF, QR codes, and digital signatures.

## Features

- ✅ **Inspection Workflow** with customizable checkpoints
- ✅ **Inspector Assignment** and status tracking
- ✅ **Result Calculation** (pass/fail/conditional)
- ✅ **Automatic Certificate Generation** after passed inspections
- ✅ **PDF Certificates** with QR codes and digital signatures
- ✅ **Certificate Verification** (public endpoint)
- ✅ **Certificate Expiry Notifications** (cron job)
- ✅ **Event-Driven Architecture** (consumes payment.completed, publishes inspection.completed)
- ✅ **Prometheus Metrics** for observability
- ✅ **Structured Logging** with correlation IDs
- ✅ **JWT Authentication** & authorization
- ✅ **Rate Limiting** (per-user)
- ✅ **Health Checks** (liveness & readiness)

## Tech Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Message Broker**: Apache Kafka
- **PDF Generation**: PDFKit
- **QR Codes**: qrcode library
- **Digital Signatures**: crypto (HMAC-SHA256)
- **Cron Jobs**: node-cron
- **Monitoring**: Prometheus, Winston
- **Testing**: Jest, Supertest

## API Endpoints

### Inspections
- `POST /api/v1/inspections/start` - Start new inspection (inspector)
- `POST /api/v1/inspections/:id/checkpoint` - Update checkpoint (inspector)
- `POST /api/v1/inspections/:id/complete` - Complete inspection (inspector)
- `GET /api/v1/inspections/:id` - Get inspection details
- `GET /api/v1/inspections` - List inspections

### Certificates
- `GET /api/v1/certificates/:id` - Get certificate details
- `GET /api/v1/certificates` - List user certificates
- `GET /api/v1/certificates/:id/download` - Download certificate PDF
- `GET /api/v1/certificates/verify/:number` - Verify certificate (public)
- `POST /api/v1/certificates/:id/revoke` - Revoke certificate (admin)

### Health & Metrics
- `GET /health` - Detailed health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe
- `GET /metrics` - Prometheus metrics

## Environment Variables

```env
# Server
PORT=3005
NODE_ENV=production

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=smartautocheck_db
POSTGRES_USER=smartautocheck
POSTGRES_PASSWORD=your-password

# JWT
JWT_SECRET=your-256-bit-secret

# Kafka
KAFKA_BROKERS=kafka:9092

# Certificate Signing
CERTIFICATE_SECRET=your-certificate-secret

# Frontend URL (for QR codes)
FRONTEND_URL=http://localhost:3010
API_GATEWAY_URL=http://api-gateway:3000

# CORS
CORS_ORIGIN=http://localhost:3010

# Logging
LOG_LEVEL=info
```

## Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Check code style
npm run lint
npm run lint:fix
```

## Docker

```bash
# Build image
docker build -t smartautocheck/inspection-certification-service:latest .

# Run container
docker run -p 3005:3005 --env-file .env smartautocheck/inspection-certification-service
```

## Inspection Workflow

1. **Payment Completed** → Kafka event consumed → Appointment unlocked
2. **Inspector Starts** → Inspection record created
3. **Checkpoint Updates** → Pass/Fail/Warning for each item
4. **Complete Inspection** → Result calculated (pass/fail/conditional)
5. **Auto-Generate Certificate** → If result = pass
6. **Publish Event** → inspection.completed to Kafka

## Certificate Features

- **PDF Generation**: Professional certificate with vehicle details
- **QR Code**: Scannable code for quick verification
- **Digital Signature**: HMAC-SHA256 cryptographic signature
- **Public Verification**: Anyone can verify authenticity
- **Expiry Tracking**: 1 year validity, notifications 30 days before
- **Revocation**: Admin can revoke certificates with reason

## Result Calculation Logic

```javascript
if (failedCheckpoints > 0) {
  result = 'fail'
} else if (warningCheckpoints > 2) {
  result = 'conditional'
} else {
  result = 'pass'
}
```

## Kafka Events

### Consumed Events
- **payment.completed**: Unlocks inspection for appointment

### Published Events
- **inspection.completed**: Triggers downstream processes

```json
{
  "eventType": "inspection.completed",
  "data": {
    "inspectionId": "uuid",
    "appointmentId": "uuid",
    "result": "pass",
    "completedAt": "2024-01-15T10:00:00Z",
    "checkpoints": {
      "total": 15,
      "passed": 14,
      "warnings": 1,
      "failed": 0
    }
  }
}
```

## Cron Jobs

**Certificate Expiry Check**: Runs daily at 9:00 AM
- Finds certificates expiring in 30 days
- Sends expiry notification emails
- Marks notifications as sent

## Metrics

Exported at `/metrics` endpoint:
- `http_request_duration_seconds` - Request latency
- `http_requests_total` - Total requests
- `inspections_total` - Inspection count by status and result
- `certificates_generated_total` - Certificate generation count
- `kafka_messages_received_total` - Kafka messages consumed
- `kafka_messages_sent_total` - Kafka messages published

## Testing

```bash
npm test -- --coverage
```

Key test scenarios:
- ✅ Start inspection with paid appointment
- ✅ Update checkpoints
- ✅ Complete inspection and calculate result
- ✅ Auto-generate certificate on pass
- ✅ Certificate verification
- ✅ Digital signature validation
- ✅ Authorization checks

## Security

- 🔒 JWT authentication for all endpoints
- 🔒 Role-based authorization (customer, inspector, admin)
- 🔒 Rate limiting per user
- 🔒 Digital signatures for certificates
- 🔒 Public certificate verification (no auth required)
- 🔒 Correlation ID tracking
- 🔒 Input validation

## Architecture

```
Kafka (payment.completed) → Consumer
         ↓
   Unlock Inspection
         ↓
   Inspector performs inspection
         ↓
   Complete inspection → Calculate result
         ↓
   Auto-generate certificate (if pass)
         ↓
   Publish inspection.completed → Kafka
```

## License

MIT
