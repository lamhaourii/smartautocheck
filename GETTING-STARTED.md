# Getting Started with SmartAutoCheck

This guide will help you set up and run SmartAutoCheck locally in under 10 minutes.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ **Docker Desktop** 20.0+ ([Download](https://www.docker.com/products/docker-desktop))
- ✅ **Node.js** 18+ ([Download](https://nodejs.org/))
- ✅ **Git** ([Download](https://git-scm.com/))
- ✅ A **PayPal Developer Account** ([Sign up](https://developer.paypal.com/))
- ✅ A **Gmail Account** (for sending emails)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/smartautocheck.git
cd smartautocheck
```

### Step 2: Setup Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

**Edit `.env` and update these critical values**:

```env
# Generate a secure JWT secret
JWT_SECRET=your-generated-secret-here

# PayPal Sandbox Credentials (get from PayPal Developer Dashboard)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Gmail SMTP (for sending emails)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password

# Certificate signing secret
CERTIFICATE_SECRET=your-certificate-secret-here
```

**How to generate secrets**:
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Certificate Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**How to get Gmail App Password**:
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate a new app password for "Mail"
5. Copy the 16-character password

### Step 3: Setup Database

```bash
cd database
npm install
npm run migrate:latest
npm run seed:run
cd ..
```

### Step 4: Start Services

```bash
docker-compose up -d
```

Wait 1-2 minutes for all services to start.

### Step 5: Verify Everything is Running

```bash
# Check service status
docker-compose ps

# Check health endpoints
curl http://localhost:3004/health  # Payment-Invoice Service
curl http://localhost:3005/health  # Inspection-Certification Service
```

### Step 6: Access the Application

Open your browser and visit:

- **Frontend**: http://localhost:3010
- **API Gateway**: http://localhost:3000
- **Kafka UI**: http://localhost:8080
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin / change-me-in-production)

### Step 7: Login with Test Account

```
Email: customer@smartautocheck.com
Password: Password123!
```

**🎉 Congratulations! SmartAutoCheck is now running locally.**

---

## 🧪 Testing the Complete Flow

### 1. Book an Appointment

1. Login as customer
2. Navigate to "Book Appointment"
3. Select date, time, and service type
4. Choose vehicle
5. Proceed to payment

### 2. Process Payment

1. Click "Pay with PayPal"
2. Use PayPal sandbox credentials
3. Complete payment
4. Verify invoice is generated

### 3. Perform Inspection (Inspector)

1. Logout and login as inspector:
   ```
   Email: inspector@smartautocheck.com
   Password: Password123!
   ```
2. View assigned inspections
3. Start inspection
4. Complete checkpoints
5. Submit inspection result

### 4. View Certificate (Customer)

1. Logout and login as customer
2. View completed appointments
3. Download certificate PDF
4. Verify certificate with QR code

---

## 🛠️ Development Mode

### Run Individual Services Locally

If you want to develop specific services without Docker:

#### 1. Start Infrastructure Only

```bash
docker-compose up postgres kafka zookeeper redis -d
```

#### 2. Run Payment-Invoice Service

```bash
cd services/payment-invoice-service
npm install
npm run dev
```

Service runs on: http://localhost:3004

#### 3. Run Inspection-Certification Service

```bash
cd services/inspection-certification-service
npm install
npm run dev
```

Service runs on: http://localhost:3005

#### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:3010

---

## 🔧 Common Commands

### Docker Compose

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f payment-invoice-service

# Restart a service
docker-compose restart payment-invoice-service

# Rebuild and start
docker-compose up --build -d
```

### Database

```bash
cd database

# Run migrations
npm run migrate:latest

# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:rollback

# Run seed data
npm run seed:run

# Create new migration
npm run migrate:make migration_name
```

### Testing

```bash
# Run tests for a service
cd services/payment-invoice-service
npm test

# Run tests with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

---

## 🐛 Troubleshooting

### Services Won't Start

**Problem**: Docker containers fail to start

**Solution**:
```bash
# Check Docker is running
docker ps

# Remove old containers and volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Start fresh
docker-compose up -d
```

### Database Connection Error

**Problem**: Services can't connect to PostgreSQL

**Solution**:
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Verify database credentials in .env
# POSTGRES_HOST should be 'postgres' (not 'localhost') in Docker

# Restart PostgreSQL
docker-compose restart postgres
```

### Kafka Connection Error

**Problem**: Services can't connect to Kafka

**Solution**:
```bash
# Wait for Kafka to fully start (takes 30-60 seconds)
docker-compose logs -f kafka

# Check Kafka is running
docker-compose ps kafka

# Restart Kafka
docker-compose restart kafka zookeeper
```

### Port Already in Use

**Problem**: Port 3004, 3005, or 3010 already in use

**Solution**:
```bash
# Find process using the port (example for 3004)
# Windows
netstat -ano | findstr :3004

# Kill the process
taskkill /PID <process_id> /F

# Or change the port in .env
PAYMENT_INVOICE_SERVICE_PORT=3014
```

### Migration Fails

**Problem**: Database migration fails

**Solution**:
```bash
cd database

# Check migration status
npm run migrate:status

# If stuck, rollback and retry
npm run migrate:rollback
npm run migrate:latest

# If completely stuck, reset database
docker-compose down -v
docker-compose up -d postgres
npm run migrate:latest
npm run seed:run
```

### PayPal Payment Fails

**Problem**: Payment doesn't complete

**Solution**:
1. Verify PayPal credentials in `.env`
2. Check PayPal mode is set to `sandbox`
3. Use PayPal sandbox test account
4. Check service logs: `docker-compose logs payment-invoice-service`

### Email Not Sending

**Problem**: Email notifications not working

**Solution**:
1. Verify Gmail App Password in `.env`
2. Check SMTP settings:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   ```
3. Enable "Less secure app access" if needed (not recommended)
4. Check service logs for detailed error

---

## 📚 Next Steps

Now that SmartAutoCheck is running, explore:

1. **API Documentation**: http://localhost:3000/api/docs
2. **Metrics Dashboard**: http://localhost:9090 (Prometheus)
3. **Service Logs**: `docker-compose logs -f`
4. **Database**: Connect with any PostgreSQL client
   - Host: localhost
   - Port: 5432
   - Database: smartautocheck_db
   - User: smartautocheck
   - Password: (from .env)

5. **Kafka Topics**: http://localhost:8080 (Kafka UI)
   - View messages
   - Monitor consumer lag
   - Inspect event schemas

---

## 🎓 Learning Resources

### Architecture
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design
- [REFACTORING-PROGRESS.md](REFACTORING-PROGRESS.md) - What changed

### Development
- [DEVELOPMENT.md](docs/DEVELOPMENT.md) - Contributing guide
- Service READMEs in each `services/*/README.md`

### Deployment
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Production deployment
- [docker-compose.yml](docker-compose.yml) - Service configuration

---

## 💡 Tips

1. **Use Kafka UI** to monitor events in real-time
2. **Check Prometheus** for service metrics
3. **View logs** with correlation IDs for debugging
4. **Test with sandbox** PayPal accounts before production
5. **Run migrations** after pulling latest code

---

## 🤝 Getting Help

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/smartautocheck/issues)
- **Troubleshooting**: [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

**Happy Coding! 🚀**
