# SmartAutoCheck - Technical Inspection Center Management System

A complete, production-ready microservices-based platform for vehicle technical inspection centers with event-driven architecture using Apache Kafka.

## 🏗️ Architecture Overview

SmartAutoCheck is built as a cloud-native, event-driven microservices system that automates the entire vehicle inspection workflow from booking to certificate issuance.

### System Architecture

```
┌─────────────────┐
│   Next.js       │
│   Frontend      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway    │◄─── Rate Limiting, Routing, Load Balancing
└────────┬────────┘
         │
    ┌────┴─────────────────────────────────────┐
    │                                           │
    ▼                                           ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   User      │  │ Appointment │  │  Payment    │
│  Service    │  │   Service   │  │  Service    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                 │
       │                └────────┬────────┘
       │                         │
       └────────────┬────────────┘
                    │
              ┌─────▼─────┐
              │   Kafka   │ ◄─── Event Bus
              │  Broker   │
              └─────┬─────┘
                    │
       ┌────────────┼────────────┬──────────────┐
       │            │            │              │
       ▼            ▼            ▼              ▼
┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Document  │ │Inspection│ │Certificate│ │ Invoice  │
│  Service  │ │  Service │ │  Service  │ │ Service  │
└───────────┘ └──────────┘ └──────────┘ └──────────┘
       │                          │              │
       └──────────┬───────────────┴──────────────┘
                  │
            ┌─────▼──────┐
            │Notification│
            │  Service   │
            └────────────┘
```

### Key Event Flows

1. **Booking Flow**: Appointment Service → Kafka → Notification Service
2. **Payment Flow**: Payment Service → Kafka → Invoice Service → Notification Service
3. **Inspection Flow**: Inspection Service → Kafka → Certificate Service → Notification Service

## 🛠️ Technology Stack

### Backend Services
- **Language**: Node.js (Express.js)
- **Databases**: 
  - PostgreSQL (transactional data)
  - MongoDB (documents, conversations)
  - Redis (caching, queues)
- **Message Broker**: Apache Kafka with Zookeeper
- **OCR**: Tesseract.js
- **PDF Generation**: PDFKit
- **Payment**: Stripe API
- **AI**: OpenAI API (Chatbot)
- **Notifications**: SendGrid (Email), Twilio (SMS)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **API Gateway**: Express with http-proxy-middleware

## 📋 Microservices

### 1. User Management Service (Port 3001)
- Authentication (JWT)
- User registration and login
- Profile management
- Role-based access control (customer, inspector, admin)

**Endpoints**:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user

### 2. Appointment Service (Port 3002)
- Booking management
- Availability checking
- Appointment scheduling
- Redis caching for performance

**Endpoints**:
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get appointment
- `GET /api/appointments/available` - Check availability
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

**Kafka Events**:
- Publishes: `appointment.created`, `appointment.updated`, `appointment.cancelled`

### 3. Payment Service (Port 3003)
- Stripe payment processing
- Payment status tracking
- Refund handling

**Endpoints**:
- `POST /api/payments` - Process payment
- `GET /api/payments/:id` - Get payment status
- `POST /api/payments/:id/refund` - Process refund

**Kafka Events**:
- Publishes: `payment.completed`, `payment.failed`, `payment.refunded`

### 4. Document Processing Service (Port 3004)
- OCR for vehicle registration cards (carte grise)
- Document upload and storage
- Data extraction and validation

**Endpoints**:
- `POST /api/documents/scan` - Upload and scan document
- `GET /api/documents/:id` - Get document data
- `POST /api/documents/validate/:id` - Validate document

**Kafka Events**:
- Publishes: `document.processed`, `document.validated`, `document.failed`

### 5. Inspection Workflow Service (Port 3005)
- Inspection state management
- Checkpoint tracking
- Result calculation (pass/fail/conditional)

**Endpoints**:
- `POST /api/inspections` - Start inspection
- `PUT /api/inspections/:id/checkpoint` - Update checkpoint
- `POST /api/inspections/:id/complete` - Complete inspection
- `GET /api/inspections/:id` - Get inspection status

**Kafka Events**:
- Publishes: `inspection.started`, `inspection.checkpoint.updated`, `inspection.completed`

### 6. Certificate Service (Port 3006)
- PDF certificate generation
- Digital signature generation
- QR code for verification
- Auto-generation on inspection completion (Kafka consumer)

**Endpoints**:
- `POST /api/certificates` - Generate certificate
- `GET /api/certificates/:id` - Download certificate
- `GET /api/certificates/:id/verify` - Verify authenticity

**Kafka Events**:
- Consumes: `inspection.completed`
- Publishes: `certificate.generated`, `certificate.verified`

### 7. Invoice Service (Port 3007)
- PDF invoice generation
- Auto-generation on payment completion (Kafka consumer)
- Customer invoice history

**Endpoints**:
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice
- `GET /api/invoices/customer/:customerId` - Get customer invoices

**Kafka Events**:
- Consumes: `payment.completed`
- Publishes: `invoice.created`

### 8. Chatbot Service (Port 3008)
- AI-powered customer support using OpenAI
- Conversation history (MongoDB)
- Fallback responses

**Endpoints**:
- `POST /api/chatbot/message` - Send message
- `GET /api/chatbot/session/:id` - Get conversation history

### 9. Notification Service (Port 3009)
- Email notifications via SendGrid
- SMS notifications via Twilio
- Universal Kafka consumer for all notification events

**Endpoints**:
- `POST /api/notifications/send` - Manual notification

**Kafka Events**:
- Consumes: All notification events from all topics

### 10. API Gateway (Port 3000)
- Central entry point
- Request routing to services
- Rate limiting
- CORS handling

## 🚀 Getting Started

### Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine + Docker Compose (Linux)
- Node.js 18+ (for local development)
- Git

### Quick Start with Docker

1. **Clone the repository**:
```bash
git clone <repository-url>
cd smartautocheck
```

2. **Create environment file**:
```bash
cp .env.example .env
```

3. **Configure environment variables** (`.env`):
```env
# Database
POSTGRES_PASSWORD=smartautocheck_pass

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Stripe (Get from https://stripe.com)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# OpenAI (Get from https://platform.openai.com)
OPENAI_API_KEY=sk-your-openai-api-key

# SendGrid (Get from https://sendgrid.com)
SENDGRID_API_KEY=your_sendgrid_api_key

# Twilio (Get from https://twilio.com)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

4. **Start all services**:
```bash
docker-compose up --build
```

This will start:
- Zookeeper (Port 2181)
- Kafka (Port 9092, 29092)
- PostgreSQL (Port 5432)
- MongoDB (Port 27017)
- Redis (Port 6379)
- All 10 microservices
- Frontend (Port 3010)

5. **Access the application**:
- Frontend: http://localhost:3010
- API Gateway: http://localhost:3000
- Individual services: Ports 3001-3009

### Local Development (Without Docker)

1. **Install dependencies for each service**:
```bash
# User service
cd services/user-service
npm install

# Repeat for all services
```

2. **Install frontend dependencies**:
```bash
cd frontend
npm install
```

3. **Start infrastructure** (Kafka, databases):
```bash
docker-compose up zookeeper kafka postgres mongodb redis
```

4. **Start services individually**:
```bash
# In separate terminals
cd services/user-service && npm run dev
cd services/appointment-service && npm run dev
# ... etc
```

5. **Start frontend**:
```bash
cd frontend
npm run dev
```

## 📊 Database Schema

### PostgreSQL Tables

**users**
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- first_name, last_name (VARCHAR)
- phone (VARCHAR)
- role (ENUM: customer, inspector, admin)
- created_at, updated_at (TIMESTAMP)

**vehicles**
- id (UUID, PK)
- user_id (UUID, FK)
- registration_number (VARCHAR, UNIQUE)
- make, model (VARCHAR)
- year (INTEGER)
- vin (VARCHAR, UNIQUE)

**appointments**
- id (UUID, PK)
- user_id, vehicle_id (UUID, FK)
- scheduled_date (TIMESTAMP)
- status (ENUM: pending, confirmed, in_progress, completed, cancelled)
- service_type (VARCHAR)
- notes (TEXT)

**inspections**
- id (UUID, PK)
- appointment_id, inspector_id (UUID, FK)
- status (ENUM)
- checkpoints (JSONB)
- result (ENUM: pass, fail, conditional)
- notes (TEXT)
- completed_at (TIMESTAMP)

**certificates**
- id (UUID, PK)
- inspection_id (UUID, FK)
- certificate_number (VARCHAR, UNIQUE)
- issue_date, expiry_date (DATE)
- pdf_url (TEXT)
- digital_signature (TEXT)
- status (ENUM: valid, expired, revoked)

**payments**
- id (UUID, PK)
- appointment_id (UUID, FK)
- amount (DECIMAL)
- currency (VARCHAR)
- status (ENUM)
- payment_method (VARCHAR)
- transaction_id (VARCHAR)
- metadata (JSONB)

**invoices**
- id (UUID, PK)
- payment_id (UUID, FK)
- invoice_number (VARCHAR, UNIQUE)
- customer_id (UUID, FK)
- amount, tax, total (DECIMAL)
- status (ENUM: issued, paid, cancelled)
- pdf_url (TEXT)

## 🔄 Kafka Topics & Events

### Topics

- `appointments-topic`
- `payments-topic`
- `documents-topic`
- `inspections-topic`
- `certificates-topic`
- `invoices-topic`
- `notifications-topic`

### Event Schema

```json
{
  "eventId": "uuid",
  "eventType": "appointment.created",
  "timestamp": "ISO-8601",
  "version": "1.0",
  "data": {
    // Event-specific payload
  },
  "metadata": {
    "source": "appointment-service",
    "userId": "user-id",
    "correlationId": "request-id"
  }
}
```

### Consumer Groups

- `certificate-service-group`: Listens to `inspections-topic`
- `invoice-service-group`: Listens to `payments-topic`
- `notification-service-group`: Listens to all topics

## 🧪 Testing

### Health Checks

All services expose a `/health` endpoint:

```bash
# API Gateway
curl http://localhost:3000/health

# User Service
curl http://localhost:3001/health

# Check Kafka
docker exec smartautocheck-kafka kafka-topics --list --bootstrap-server localhost:9092
```

### API Testing

```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Create appointment (use token from login)
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "user-uuid",
    "vehicleId": "vehicle-uuid",
    "scheduledDate": "2024-02-01T10:00:00Z",
    "serviceType": "standard"
  }'
```

## 🔒 Security Features

- JWT authentication with bcrypt password hashing
- HTTPS/TLS support
- Rate limiting on all endpoints
- Input validation with Joi
- SQL injection prevention (parameterized queries)
- CORS configuration
- Helmet.js security headers
- Environment-based secrets

## 📈 Scalability

### Horizontal Scaling

Scale individual services:

```bash
docker-compose up --scale appointment-service=3 --scale payment-service=2
```

### Kafka Partitioning

Topics are configured with partitions for parallel processing. Consumer groups automatically distribute load.

### Caching

Redis caching implemented in high-traffic services (appointments) to reduce database load.

## 🐛 Troubleshooting

### Kafka Connection Issues

```bash
# Check Kafka health
docker exec smartautocheck-kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# View Kafka logs
docker logs smartautocheck-kafka

# Recreate Kafka topics
docker exec smartautocheck-kafka kafka-topics --delete --topic appointments-topic --bootstrap-server localhost:9092
```

### Database Connection Issues

```bash
# Check PostgreSQL
docker exec smartautocheck-postgres pg_isready -U smartautocheck

# Connect to PostgreSQL
docker exec -it smartautocheck-postgres psql -U smartautocheck -d smartautocheck_db

# Check MongoDB
docker exec smartautocheck-mongodb mongosh --eval "db.adminCommand('ping')"
```

### Service Dependencies

Services start in this order:
1. Infrastructure (Zookeeper, Kafka, databases)
2. Backend services (wait for infrastructure health checks)
3. API Gateway (waits for services)
4. Frontend (waits for API Gateway)

## 📝 API Documentation

Detailed API documentation is available at `/docs` endpoint (when implemented with Swagger/OpenAPI).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License

## 👥 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@smartautocheck.com
- Documentation: https://docs.smartautocheck.com

## 🎯 Roadmap

- [ ] Kubernetes deployment manifests
- [ ] Prometheus + Grafana monitoring
- [ ] ELK Stack for centralized logging
- [ ] API rate limiting per user
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Admin analytics dashboard
- [ ] Automated testing suite

---

Built with ❤️ by the SmartAutoCheck Team
