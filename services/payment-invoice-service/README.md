# Payment & Invoice Service

Consolidated microservice handling payment processing via PayPal and automatic invoice generation with PDF creation.

## Features

- ✅ **PayPal Integration** with circuit breaker pattern
- ✅ **Automatic Invoice Generation** with QR codes
- ✅ **Payment History** tracking
- ✅ **Refund Processing**
- ✅ **Event-Driven Architecture** (publishes payment.completed events)
- ✅ **Prometheus Metrics** for observability
- ✅ **Structured Logging** with correlation IDs
- ✅ **JWT Authentication** & authorization
- ✅ **Rate Limiting** (per-user)
- ✅ **Health Checks** (liveness & readiness)
- ✅ **Comprehensive Testing** (70% coverage target)

## Tech Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Message Broker**: Apache Kafka
- **Payment Gateway**: PayPal Checkout SDK
- **PDF Generation**: PDFKit
- **Monitoring**: Prometheus, Winston
- **Testing**: Jest, Supertest
- **Security**: Helmet.js, JWT, Rate Limiting

## API Endpoints

### Payments
- `POST /api/v1/payments` - Create payment order
- `POST /api/v1/payments/capture` - Capture PayPal order
- `GET /api/v1/payments/:paymentId` - Get payment details
- `GET /api/v1/payments` - List user payments
- `POST /api/v1/payments/:paymentId/refund` - Refund payment (admin)

### Invoices
- `GET /api/v1/invoices/:invoiceId` - Get invoice details
- `GET /api/v1/invoices` - List user invoices
- `GET /api/v1/invoices/:invoiceId/download` - Download invoice PDF
- `GET /api/v1/invoices/verify/:invoiceNumber` - Verify invoice (public)

### Health & Metrics
- `GET /health` - Detailed health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe
- `GET /metrics` - Prometheus metrics

## Environment Variables

```env
# Server
PORT=3004
NODE_ENV=production

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=smartautocheck_db
POSTGRES_USER=smartautocheck
POSTGRES_PASSWORD=your-password

# JWT
JWT_SECRET=your-256-bit-secret

# PayPal
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
PAYPAL_MODE=sandbox
PAYPAL_RETURN_URL=http://localhost:3010/payment/success
PAYPAL_CANCEL_URL=http://localhost:3010/payment/cancel

# Kafka
KAFKA_BROKERS=kafka:9092

# Frontend URL
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

# Run integration tests
npm run test:integration

# Check code style
npm run lint
npm run lint:fix
```

## Docker

```bash
# Build image
docker build -t smartautocheck/payment-invoice-service:latest .

# Run container
docker run -p 3004:3004 --env-file .env smartautocheck/payment-invoice-service
```

## Circuit Breaker

PayPal API calls are protected with circuit breakers using Opossum:
- **Timeout**: 5 seconds
- **Error Threshold**: 50%
- **Reset Timeout**: 30 seconds

## Kafka Events

### Published Events
- **payment.completed**: Triggers invoice generation and unlocks inspection

```json
{
  "eventType": "payment.completed",
  "data": {
    "paymentId": "uuid",
    "appointmentId": "uuid",
    "userId": "uuid",
    "amount": 50.00,
    "currency": "USD",
    "transactionId": "capture-id"
  }
}
```

## Metrics

Exported at `/metrics` endpoint:
- `http_request_duration_seconds` - Request latency
- `http_requests_total` - Total requests
- `payment_transactions_total` - Payment transaction count
- `invoices_generated_total` - Invoice generation count
- `kafka_messages_sent_total` - Kafka messages sent
- `db_connection_pool_size` - Database pool metrics

## Testing

Run the complete test suite:

```bash
npm test -- --coverage
```

Key test scenarios:
- ✅ Payment creation with valid appointment
- ✅ Payment capture and event publishing
- ✅ Automatic invoice generation
- ✅ Refund processing
- ✅ Authorization checks
- ✅ Error handling

## Architecture

```
Client → API Gateway → Payment-Invoice Service
                            ↓
                       PayPal API (with Circuit Breaker)
                            ↓
                       PostgreSQL
                            ↓
                       Kafka (payment.completed event)
                            ↓
                       Invoice PDF Generation
```

## Security

- 🔒 JWT authentication required for all endpoints (except invoice verification)
- 🔒 Role-based authorization (customer, admin)
- 🔒 Rate limiting per user (100 req/15min)
- 🔒 Strict payment operation limits (10 attempts/hour)
- 🔒 Input validation with Joi
- 🔒 CORS configuration
- 🔒 Security headers via Helmet.js
- 🔒 Correlation ID tracking

## Monitoring

Health check response:
```json
{
  "status": "healthy",
  "dependencies": {
    "database": { "status": "connected", "latency": "5ms" },
    "kafka": { "status": "connected" },
    "paypal": {
      "circuitBreakers": {
        "createOrder": { "state": "closed" },
        "captureOrder": { "state": "closed" }
      }
    }
  }
}
```

## License

MIT
