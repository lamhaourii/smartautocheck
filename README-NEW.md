# SmartAutoCheck - Vehicle Technical Inspection Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-%3E%3D20.0.0-blue)](https://www.docker.com/)

A production-ready, event-driven microservices platform for vehicle technical inspection centers. Built with modern architecture patterns, comprehensive observability, and professional user experience.

---

## 🏗️ Architecture Overview

SmartAutoCheck uses a **consolidated microservices architecture** with 5 core services communicating via Apache Kafka.

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend                              │
│                    Next.js 14 + TypeScript                    │
│              TailwindCSS + shadcn/ui + Framer Motion         │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                      API Gateway (v1)                         │
│     Routing • Rate Limiting • Circuit Breakers • Auth        │
└─────┬────────┬────────────┬────────────┬───────────┬────────┘
      │        │            │            │           │
      ▼        ▼            ▼            ▼           ▼
┌─────────┐ ┌──────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  User   │ │Appt  │ │ Payment  │ │Inspection│ │Observ-   │
│ Service │ │Service│ │ Invoice  │ │  Cert    │ │ability   │
│         │ │      │ │ Service  │ │ Service  │ │(Prom/Gr) │
└────┬────┘ └───┬──┘ └────┬─────┘ └────┬─────┘ └──────────┘
     │          │         │            │
     └──────────┴────┬────┴────────────┘
                     │
              ┌──────▼──────┐
              │    Kafka    │
              │  Event Bus  │
              └──────┬──────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
payment.completed  inspection.  (DLQ for
                   completed     failures)
      │              │
      └──────┬───────┘
             │
    ┌────────▼────────┐
    │   PostgreSQL    │
    │   (Primary DB)  │
    └─────────────────┘
```

---

## ✨ Key Features

### For Customers
- 🗓️ **Online Booking** - Schedule inspections 24/7
- 💳 **PayPal Payments** - Secure payment processing
- 📱 **Real-time Status** - Track inspection progress
- 📄 **Digital Certificates** - Download PDF certificates instantly
- 🔔 **Smart Notifications** - Email & SMS reminders
- 📊 **Dashboard** - View history and upcoming appointments

### For Inspectors
- 📋 **Inspection Workflow** - Guided checkpoint system
- ✅ **Pass/Fail/Warning** - Flexible result tracking
- 📸 **Photo Upload** - Document issues (optional)
- 🎯 **Auto-certification** - Certificates generated on pass
- 📈 **Performance Metrics** - Track completed inspections

### For Administrators
- 👥 **User Management** - Manage customers, inspectors
- 📊 **Analytics Dashboard** - Revenue, completion rates
- 🔍 **Certificate Verification** - Public QR code verification
- 🚫 **Certificate Revocation** - Revoke with reason tracking
- 📈 **Reports** - Generate PDF reports

---

## 🏛️ System Architecture

### 5 Core Services

#### 1. **User Service** (`services/user-service/`)
- User registration, login, JWT authentication
- Role-based access control (customer, inspector, admin)
- Refresh token mechanism
- Password reset via email
- User preferences

#### 2. **Appointment Service** (`services/appointment-service/`)
- Appointment booking and scheduling
- Availability checking
- Conflict detection
- Email/SMS notifications
- Appointment reminders (cron job)

#### 3. **Payment-Invoice Service** (`services/payment-invoice-service/`) ✨ NEW
- PayPal integration with circuit breaker
- Payment capture and refund
- Automatic invoice PDF generation
- QR code on invoices
- Payment history

**Kafka**: Publishes `payment.completed` event

#### 4. **Inspection-Certification Service** (`services/inspection-certification-service/`) ✨ NEW
- Inspection workflow with checkpoints
- Result calculation (pass/fail/conditional)
- Automatic certificate generation
- PDF certificates with digital signatures (HMAC-SHA256)
- QR code verification
- Certificate expiry notifications (cron job)

**Kafka**: Consumes `payment.completed`, publishes `inspection.completed`

#### 5. **API Gateway** (`services/api-gateway/`)
- Request routing with versioning (`/api/v1/...`)
- Rate limiting per user
- Circuit breakers for downstream services
- Correlation ID tracking
- Health check aggregation
- Swagger documentation

---

## 🚀 Quick Start

### Prerequisites

- **Docker** 20.0+
- **Docker Compose** 2.0+
- **Node.js** 18+ (for local development)
- **PostgreSQL** 15+ (or use Docker)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/smartautocheck.git
cd smartautocheck
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials (PayPal, SMTP, Twilio)
```

**Required Variables**:
- `PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET` (sandbox)
- `SMTP_USER` & `SMTP_PASSWORD` (for emails)
- `TWILIO_ACCOUNT_SID` & `TWILIO_AUTH_TOKEN` (for SMS)
- `JWT_SECRET` (generate: `openssl rand -base64 32`)

### 3. Run Database Migrations

```bash
cd database
npm install
npm run migrate:latest
npm run seed:run  # Optional: Load test data
```

### 4. Start All Services

```bash
docker-compose up
```

**Services will be available at**:
- Frontend: http://localhost:3010
- API Gateway: http://localhost:3000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
- Kafka UI: http://localhost:8080

### 5. Login with Test Accounts

```
Admin:     admin@smartautocheck.com / Password123!
Inspector: inspector@smartautocheck.com / Password123!
Customer:  customer@smartautocheck.com / Password123!
```

---

## 📦 Project Structure

```
smartautocheck/
├── .github/
│   └── workflows/           # CI/CD pipelines
│       ├── ci-cd.yml
│       └── database-migrations.yml
├── database/                # Database migrations & seeds
│   ├── knexfile.js
│   ├── migrations/
│   └── seeds/
├── services/
│   ├── api-gateway/
│   ├── user-service/
│   ├── appointment-service/
│   ├── payment-invoice-service/      # ✨ NEW (consolidated)
│   └── inspection-certification-service/  # ✨ NEW (consolidated)
├── shared/
│   ├── notifications/       # ✨ NEW (replaces notification-service)
│   ├── common/
│   ├── event-schemas/
│   └── kafka-config/
├── frontend/                # Next.js 14 application
├── infrastructure/          # Observability configs
├── docs/                    # Additional documentation
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔧 Development

### Local Development (Without Docker)

#### Start Individual Services

```bash
# Terminal 1: Kafka & PostgreSQL
docker-compose up postgres kafka zookeeper

# Terminal 2: Payment-Invoice Service
cd services/payment-invoice-service
npm install
npm run dev

# Terminal 3: Inspection-Certification Service
cd services/inspection-certification-service
npm install
npm run dev

# Terminal 4: Frontend
cd frontend
npm install
npm run dev
```

### Run Tests

```bash
# Unit tests
cd services/payment-invoice-service
npm test

# Integration tests
npm run test:integration

# Coverage report
npm test -- --coverage
```

### Database Commands

```bash
cd database

# Run migrations
npm run migrate:latest

# Check status
npm run migrate:status

# Rollback
npm run migrate:rollback

# Create new migration
npm run migrate:make add_column_name

# Run seeds
npm run seed:run
```

---

## 📊 Observability

### Metrics (Prometheus)

Available at: http://localhost:9090

**Key Metrics**:
- `http_request_duration_seconds` - Request latency
- `http_requests_total` - Total requests
- `payment_transactions_total` - Payment count
- `inspections_total` - Inspection count
- `certificates_generated_total` - Certificate count
- `kafka_messages_sent_total` - Kafka messages

### Dashboards (Grafana)

Available at: http://localhost:3001 (admin/change-me-in-production)

**Pre-configured Dashboards**:
1. Service Health Overview
2. Request Rate & Latency
3. Error Rate Trends
4. Kafka Topic Lag
5. Database Connection Pools

### Logs (Loki)

Structured JSON logs with correlation IDs.

Query example:
```
{service="payment-invoice-service"} |= "error"
```

### Distributed Tracing (Jaeger)

Available at: http://localhost:16686

Trace requests across services with correlation IDs.

---

## 🔐 Security

### Authentication & Authorization
- **JWT** with refresh tokens (access: 15min, refresh: 7 days)
- **Role-based access** (customer, inspector, admin)
- **Password policy** (min 8 chars, complexity required)
- **Email verification** for new accounts

### API Security
- **Rate limiting** per user (100 req/15min authenticated)
- **CORS** with whitelisted origins
- **Helmet.js** for security headers
- **Input validation** with Joi
- **Parameterized queries** (prevent SQL injection)

### Certificate Security
- **Digital signatures** (HMAC-SHA256)
- **QR codes** for verification
- **Public verification** endpoint (no auth required)
- **Revocation** capability with reason tracking

### Secrets Management
- **No hardcoded secrets** in code
- **Environment variables** for all credentials
- **Docker secrets** for production
- **.env** never committed to git

---

## 🧪 Testing

### Test Coverage Target: 70%

```bash
# Run all tests with coverage
npm test -- --coverage

# Watch mode
npm run test:watch

# Integration tests only
npm run test:integration
```

### Test Types

1. **Unit Tests** - Business logic, utilities
2. **Integration Tests** - Database ops, Kafka flows, API endpoints
3. **End-to-End Tests** - Complete user flows (Playwright)

---

## 📡 API Documentation

### Interactive API Docs

Available at: http://localhost:3000/api/docs (Swagger UI)

### Key Endpoints

#### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/reset-password
```

#### Appointments
```
POST   /api/v1/appointments
GET    /api/v1/appointments/:id
PATCH  /api/v1/appointments/:id
DELETE /api/v1/appointments/:id/cancel
```

#### Payments
```
POST   /api/v1/payments
POST   /api/v1/payments/capture
GET    /api/v1/payments/:id
POST   /api/v1/payments/:id/refund
```

#### Inspections
```
POST   /api/v1/inspections/start
POST   /api/v1/inspections/:id/checkpoint
POST   /api/v1/inspections/:id/complete
GET    /api/v1/inspections/:id
```

#### Certificates
```
GET    /api/v1/certificates/:id
GET    /api/v1/certificates/:id/download
GET    /api/v1/certificates/verify/:number  # Public
POST   /api/v1/certificates/:id/revoke      # Admin
```

---

## 🚢 Deployment

### Docker Compose (Development)

```bash
docker-compose up -d
```

### Production Deployment

1. **Build images**:
```bash
docker-compose -f docker-compose.prod.yml build
```

2. **Push to registry**:
```bash
docker-compose -f docker-compose.prod.yml push
```

3. **Deploy** (Kubernetes/AWS ECS/etc):
```bash
kubectl apply -f k8s/
```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed guide.

---

## 🌐 Environment Variables

See [`.env.example`](.env.example) for all available variables.

**Critical Variables**:

```env
# Database
POSTGRES_HOST=postgres
POSTGRES_PASSWORD=change-me-in-production

# JWT
JWT_SECRET=your-256-bit-secret-key

# PayPal
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-client-secret

# Email (SMTP)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token

# Certificate Signing
CERTIFICATE_SECRET=your-certificate-secret
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Run linter (`npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

---

## 📖 Documentation

- [Architecture](docs/ARCHITECTURE.md) - Detailed system design
- [API Reference](docs/API.md) - Complete API documentation
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Development Guide](docs/DEVELOPMENT.md) - Local setup & contributing
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues

---

## 🏆 Production Checklist

- [x] Service consolidation (10 → 5)
- [x] Event-driven architecture (Kafka)
- [x] PayPal integration with circuit breakers
- [x] Automatic PDF generation (invoices & certificates)
- [x] Digital signatures & QR codes
- [x] JWT authentication with refresh tokens
- [x] Rate limiting per user
- [x] Prometheus metrics
- [x] Structured logging
- [x] Database migrations (Knex)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Docker containerization
- [ ] Observability stack (Prometheus, Grafana, Loki, Jaeger)
- [ ] Comprehensive testing (70% coverage)
- [ ] Frontend (Next.js 14)
- [ ] End-to-end tests (Playwright)

---

## 📊 System Requirements

### Production
- **CPU**: 4 cores minimum
- **RAM**: 8GB minimum
- **Storage**: 50GB SSD
- **PostgreSQL**: 15+
- **Kafka**: 3 brokers for HA
- **Node.js**: 18+

### Development
- **CPU**: 2 cores
- **RAM**: 4GB
- **Docker**: 20.0+
- **Node.js**: 18+

---

## 🐛 Known Issues

None currently. Check [Issues](https://github.com/yourusername/smartautocheck/issues) for active bugs.

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **SmartAutoCheck Team**

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - Frontend framework
- [Express.js](https://expressjs.com/) - Backend framework
- [Apache Kafka](https://kafka.apache.org/) - Event streaming
- [PayPal](https://developer.paypal.com/) - Payment processing
- [Prometheus](https://prometheus.io/) - Monitoring
- [Grafana](https://grafana.com/) - Dashboards

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/smartautocheck/issues)
- **Email**: support@smartautocheck.com

---

**Built with ❤️ for modern vehicle inspection centers**
