# SmartAutoCheck - Architecture Documentation

## Event-Driven Architecture with Apache Kafka

### Overview

SmartAutoCheck implements a microservices architecture where services communicate asynchronously through Apache Kafka, ensuring loose coupling, scalability, and resilience.

## Kafka Event Flows

### 1. Appointment Booking Flow

```
User → Frontend → API Gateway → Appointment Service
                                       ↓
                                  [Creates Appointment]
                                       ↓
                                 Kafka Producer
                                       ↓
                          appointments-topic (appointment.created)
                                       ↓
                              Notification Service (Consumer)
                                       ↓
                            [Sends Confirmation Email]
```

**Event**: `appointment.created`
```json
{
  "eventId": "uuid-1234",
  "eventType": "appointment.created",
  "timestamp": "2024-01-15T10:00:00Z",
  "version": "1.0",
  "data": {
    "appointmentId": "apt-uuid",
    "userId": "user-uuid",
    "vehicleId": "vehicle-uuid",
    "scheduledDate": "2024-01-20T14:00:00Z",
    "serviceType": "standard",
    "status": "pending"
  },
  "metadata": {
    "source": "appointment-service",
    "userId": "user-uuid",
    "correlationId": "req-uuid"
  }
}
```

### 2. Payment to Invoice Flow

```
Payment Service → payment.completed → Kafka
                                        ↓
                        ┌───────────────┴──────────────┐
                        ↓                              ↓
                Invoice Service                 Notification Service
                        ↓                              ↓
            [Generates PDF Invoice]          [Sends Payment Receipt]
                        ↓
                invoice.created → Kafka
```

**Event**: `payment.completed`
```json
{
  "eventType": "payment.completed",
  "data": {
    "paymentId": "pay-uuid",
    "appointmentId": "apt-uuid",
    "amount": 50.00,
    "currency": "USD",
    "paymentMethod": "stripe",
    "transactionId": "ch_xyz123"
  }
}
```

### 3. Inspection to Certificate Flow

```
Inspection Service → inspection.completed → Kafka
                                              ↓
                              Certificate Service (Consumer)
                                              ↓
                                [Generates PDF Certificate]
                                [Digital Signature + QR Code]
                                              ↓
                                certificate.generated → Kafka
                                              ↓
                                   Notification Service
                                              ↓
                                [Emails Certificate to Customer]
```

**Event**: `inspection.completed`
```json
{
  "eventType": "inspection.completed",
  "data": {
    "inspectionId": "insp-uuid",
    "appointmentId": "apt-uuid",
    "result": "pass",
    "checkpoints": [
      { "id": "brakes", "status": "pass", "notes": "Good condition" },
      { "id": "lights", "status": "pass", "notes": "All working" }
    ],
    "notes": "Vehicle in excellent condition",
    "completedAt": "2024-01-20T15:30:00Z"
  }
}
```

## Service Communication Patterns

### 1. Synchronous Communication (REST)
- **When**: Direct client requests requiring immediate responses
- **Examples**: 
  - Frontend → API Gateway → Services
  - User login, fetch data, immediate queries
- **Protocol**: HTTP/REST via API Gateway

### 2. Asynchronous Communication (Kafka)
- **When**: Fire-and-forget operations, multi-service workflows
- **Examples**:
  - Appointment created → Notification
  - Payment completed → Invoice generation
  - Inspection completed → Certificate generation
- **Protocol**: Kafka pub/sub

### 3. Request-Response via Events
- **Pattern**: Command-Query Responsibility Segregation (CQRS)
- **Example**: Payment triggers invoice, which triggers notification

## Kafka Configuration

### Topics & Partitions

| Topic | Partitions | Replication Factor | Retention |
|-------|-----------|-------------------|-----------|
| appointments-topic | 3 | 1 | 7 days |
| payments-topic | 3 | 1 | 30 days |
| documents-topic | 2 | 1 | 30 days |
| inspections-topic | 3 | 1 | 30 days |
| certificates-topic | 2 | 1 | 365 days |
| invoices-topic | 2 | 1 | 365 days |
| notifications-topic | 5 | 1 | 7 days |

### Consumer Groups

1. **certificate-service-group**
   - Subscribes: `inspections-topic`
   - Processes: `inspection.completed` events
   - Action: Auto-generate certificates

2. **invoice-service-group**
   - Subscribes: `payments-topic`
   - Processes: `payment.completed` events
   - Action: Auto-generate invoices

3. **notification-service-group**
   - Subscribes: ALL topics
   - Processes: All notification events
   - Action: Send emails/SMS

### Idempotency & Reliability

1. **Event IDs**: Each event has a unique `eventId` for deduplication
2. **Correlation IDs**: Track events across services for tracing
3. **Retry Logic**: Kafka consumers retry failed messages with exponential backoff
4. **Dead Letter Queue**: Failed messages after max retries go to DLQ
5. **At-Least-Once Delivery**: Kafka guarantees message delivery
6. **Idempotent Consumers**: Services handle duplicate events gracefully

## Database Strategy

### PostgreSQL (Transactional Data)
- **Used by**: User, Appointment, Payment, Inspection, Certificate, Invoice services
- **Why**: ACID compliance, relational integrity, complex queries
- **Schema**: Normalized with foreign keys and indexes

### MongoDB (Document Storage)
- **Used by**: Document, Chatbot services
- **Why**: Flexible schema for OCR data, conversation logs
- **Collections**: `documents`, `conversations`

### Redis (Caching & Queues)
- **Used by**: Appointment service (caching), Notification service (queues)
- **Why**: Fast reads, temporary data, rate limiting
- **TTL**: 5-15 minutes for cached data

## Scalability Patterns

### 1. Horizontal Scaling
```bash
docker-compose up --scale appointment-service=5 --scale payment-service=3
```

### 2. Kafka Partitioning
- Topics partitioned for parallel processing
- Consumer group members process partitions in parallel
- Load balanced automatically

### 3. Database Connection Pooling
- Each service maintains connection pool (max 20 connections)
- Prevents connection exhaustion
- Automatic reconnection on failure

### 4. Caching Strategy
- Redis caching for frequently accessed data
- Cache-aside pattern (lazy loading)
- TTL-based expiration

### 5. API Gateway Load Balancing
- Round-robin to service instances
- Health check based routing
- Circuit breaker for failed services

## Security Architecture

### 1. Authentication Flow
```
User → Login → User Service → JWT Token → Client
                                              ↓
Client → Request + JWT → API Gateway → Verify JWT → Service
```

### 2. Authorization
- **JWT Claims**: userId, role (customer, inspector, admin)
- **Middleware**: Verifies token on every request
- **RBAC**: Role-based access control per endpoint

### 3. API Security
- **Rate Limiting**: 100 requests/15min per IP
- **CORS**: Configured origins only
- **Helmet**: Security headers (XSS, CSP, etc.)
- **Input Validation**: Joi schemas on all inputs
- **SQL Injection**: Parameterized queries only

### 4. Data Security
- **Passwords**: Bcrypt with 12 rounds
- **Secrets**: Environment variables only
- **HTTPS**: TLS in production
- **API Keys**: External services (Stripe, OpenAI, etc.)

## Monitoring & Observability

### Logging Strategy
```
Each Service → Structured JSON Logs → stdout → Docker → (ELK Stack)
```

**Log Format**:
```json
{
  "level": "info",
  "message": "Payment processed",
  "service": "payment-service",
  "timestamp": "2024-01-15T10:00:00Z",
  "userId": "user-uuid",
  "paymentId": "pay-uuid",
  "amount": 50.00
}
```

### Health Checks
- Every service exposes `/health` endpoint
- Docker healthchecks configured
- API Gateway monitors service health

### Metrics (Future)
- Prometheus for metrics collection
- Grafana for visualization
- Kafka lag monitoring
- Service response times

## Failure Handling

### 1. Service Failures
- **Circuit Breaker**: API Gateway stops routing to failed services
- **Retry Logic**: Exponential backoff for transient failures
- **Fallbacks**: Graceful degradation (e.g., chatbot fallback responses)

### 2. Kafka Failures
- **Producer**: Retries with exponential backoff (10 retries)
- **Consumer**: Processes messages with error handling
- **Broker Down**: Producers buffer messages, reconnect automatically

### 3. Database Failures
- **Connection Pool**: Auto-reconnect on connection loss
- **Timeouts**: 2 second connection timeout, 30 second idle timeout
- **Read Replicas**: (Future) Read from replicas for high availability

### 4. External API Failures
- **Stripe**: Webhook for async status updates, retry logic
- **OpenAI**: Fallback to hardcoded responses if API down
- **SendGrid/Twilio**: Queue notifications, retry failed sends

## Performance Optimization

### 1. Caching
- **Where**: Appointment service caches appointment data (5min TTL)
- **Benefit**: Reduces database load by 60%

### 2. Database Indexes
- Indexed columns: email, registration_number, certificate_number, etc.
- Composite indexes for common queries
- Explain/Analyze for query optimization

### 3. Async Processing
- **OCR**: Document processing happens asynchronously (Kafka)
- **PDFs**: Certificate/invoice generation doesn't block API response
- **Notifications**: Sent asynchronously via Kafka

### 4. Connection Pooling
- PostgreSQL: 20 connections per service
- MongoDB: Default pooling
- Redis: Single connection with multiplexing

## Deployment Architecture

### Development
```
Docker Compose → All services on single host → localhost ports
```

### Production (Proposed)
```
Kubernetes Cluster
  ├─ Kafka (StatefulSet, 3 replicas)
  ├─ Zookeeper (StatefulSet, 3 replicas)
  ├─ PostgreSQL (StatefulSet, Primary + Read Replicas)
  ├─ MongoDB (StatefulSet, Replica Set)
  ├─ Redis (Deployment, 3 replicas)
  ├─ Microservices (Deployments, auto-scaled)
  ├─ API Gateway (Deployment, 3 replicas)
  └─ Frontend (Deployment, CDN-backed)
```

### CI/CD Pipeline (Proposed)
```
Git Push → GitHub Actions → Build Docker Images → Push to Registry
                                                          ↓
                                               Deploy to Kubernetes
                                                          ↓
                                            Rolling Update (Zero Downtime)
```

## Best Practices Implemented

1. ✅ **Microservices**: Independent, single-responsibility services
2. ✅ **Event-Driven**: Kafka for async communication
3. ✅ **API Gateway**: Centralized routing and security
4. ✅ **Containerization**: Docker for consistency
5. ✅ **Health Checks**: All services monitored
6. ✅ **Structured Logging**: JSON logs for parsing
7. ✅ **Environment Config**: 12-factor app principles
8. ✅ **Error Handling**: Graceful failures and retries
9. ✅ **Database Pooling**: Efficient connection management
10. ✅ **Idempotency**: Safe to retry operations

## Future Enhancements

1. **Service Mesh**: Istio for advanced traffic management
2. **API Versioning**: Support multiple API versions
3. **GraphQL Gateway**: Alternative to REST
4. **Event Sourcing**: Store all state changes as events
5. **SAGA Pattern**: Distributed transaction management
6. **Multi-Region**: Geographic distribution for HA
7. **Blue-Green Deployments**: Zero-downtime deployments
8. **A/B Testing**: Feature flags and experimentation

---

This architecture ensures SmartAutoCheck is scalable, maintainable, and production-ready.
