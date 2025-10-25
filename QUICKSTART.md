# SmartAutoCheck - Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- **Docker Desktop** installed ([Download](https://www.docker.com/products/docker-desktop))
- **Git** installed
- **8GB RAM** minimum recommended
- **10GB disk space** for containers and images

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd smartautocheck
```

### 2. Create Environment File

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your preferred text editor
# You can use the default values for testing, but update these for production:
# - JWT_SECRET (use a strong random string)
# - STRIPE_SECRET_KEY (get from stripe.com)
# - OPENAI_API_KEY (get from platform.openai.com)
# - SENDGRID_API_KEY (get from sendgrid.com)
# - TWILIO credentials (get from twilio.com)
```

### 3. Start All Services

```bash
# Build and start all containers (this may take 5-10 minutes first time)
docker-compose up --build

# OR run in detached mode (background)
docker-compose up -d --build
```

**What's happening?**
- Building Docker images for all 10 microservices
- Starting Kafka, Zookeeper, PostgreSQL, MongoDB, Redis
- Initializing databases with schemas
- Starting all services and the frontend
- Services will be ready when you see "running on port" messages

### 4. Verify Services are Running

```bash
# Check all containers
docker-compose ps

# Should show 16 containers running:
# - zookeeper, kafka
# - postgres, mongodb, redis  
# - 10 microservices
# - api-gateway, frontend
```

### 5. Access the Application

Open your browser and navigate to:

- **Frontend**: http://localhost:3010
- **API Gateway**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health

### 6. Test the System

#### Option A: Use the Frontend

1. Go to http://localhost:3010
2. Click "Book Now"
3. Follow the booking wizard
4. Complete all steps

#### Option B: Use cURL

```bash
# 1. Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }'

# 2. Login (save the token from response)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'

# 3. Create an appointment (use token from step 2)
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "userId": "USER_ID_FROM_REGISTER",
    "vehicleId": "VEHICLE_ID",
    "scheduledDate": "2024-12-31T10:00:00Z",
    "serviceType": "standard",
    "notes": "First inspection"
  }'
```

### 7. View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f user-service
docker-compose logs -f kafka
docker-compose logs -f frontend

# View last 100 lines
docker-compose logs --tail=100 appointment-service
```

### 8. Check Kafka Topics

```bash
# List all Kafka topics
docker exec smartautocheck-kafka kafka-topics --list --bootstrap-server localhost:9092

# You should see:
# - appointments-topic
# - payments-topic
# - documents-topic
# - inspections-topic
# - certificates-topic
# - invoices-topic
# - notifications-topic

# View messages in a topic
docker exec smartautocheck-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic appointments-topic \
  --from-beginning
```

### 9. Access Databases

```bash
# PostgreSQL
docker exec -it smartautocheck-postgres psql -U smartautocheck -d smartautocheck_db

# Inside PostgreSQL:
# \dt                    - list tables
# SELECT * FROM users;   - query users
# \q                     - quit

# MongoDB
docker exec -it smartautocheck-mongodb mongosh -u smartautocheck -p smartautocheck_pass

# Inside MongoDB:
# show databases
# use smartautocheck_db
# show collections
# db.documents.find()
# exit

# Redis
docker exec -it smartautocheck-redis redis-cli

# Inside Redis:
# KEYS *
# GET appointment:some-id
# exit
```

## Common Issues & Solutions

### Port Already in Use

**Error**: "Bind for 0.0.0.0:3000 failed: port is already allocated"

**Solution**:
```bash
# Find what's using the port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

# Kill the process or change the port in docker-compose.yml
```

### Kafka Connection Timeout

**Error**: "TimeoutError: Failed to connect to Kafka"

**Solution**:
```bash
# Wait for Kafka to fully start (can take 30-60 seconds)
docker-compose logs kafka

# Look for: "Kafka Server started"

# Restart services after Kafka is ready
docker-compose restart appointment-service payment-service
```

### Out of Memory

**Error**: "Container exited with code 137"

**Solution**:
```bash
# Increase Docker memory
# Docker Desktop → Settings → Resources → Memory → 8GB minimum

# Or run fewer services
docker-compose up postgres mongodb redis kafka zookeeper user-service api-gateway frontend
```

### Database Connection Failed

**Error**: "Error: connect ECONNREFUSED"

**Solution**:
```bash
# Check database health
docker exec smartautocheck-postgres pg_isready -U smartautocheck

# Restart the database
docker-compose restart postgres

# Recreate from scratch if needed
docker-compose down -v
docker-compose up --build
```

## Stopping the System

```bash
# Stop all containers (keeps data)
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# Stop individual service
docker-compose stop user-service
```

## Development Workflow

### Making Changes to a Service

```bash
# 1. Make code changes
# 2. Rebuild and restart that service
docker-compose up -d --build user-service

# 3. View logs
docker-compose logs -f user-service
```

### Adding Dependencies

```bash
# 1. Add to package.json in the service folder
# 2. Rebuild
docker-compose up -d --build service-name
```

### Database Changes

```bash
# For new migrations, update services/init-db.sql
# Then recreate database:
docker-compose down postgres
docker-compose up -d postgres

# Wait for health check
docker-compose ps postgres
```

## Next Steps

1. **Explore the API**: Check `README.md` for full API documentation
2. **Read Architecture**: See `ARCHITECTURE.md` for system design
3. **Configure External APIs**: 
   - Get Stripe keys for real payments
   - Get OpenAI key for chatbot
   - Get SendGrid/Twilio for notifications
4. **Customize Frontend**: Edit files in `frontend/app/`
5. **Add Features**: Build new microservices following existing patterns

## Production Deployment

For production deployment:

1. Update all secrets in `.env`
2. Enable HTTPS/TLS
3. Set up proper Kafka cluster (not single node)
4. Use managed databases (AWS RDS, MongoDB Atlas)
5. Deploy to Kubernetes or cloud platform
6. Set up monitoring and logging
7. Configure backups

See `README.md` for detailed production guidelines.

## Getting Help

- **Logs**: First check `docker-compose logs -f`
- **Health Checks**: Visit http://localhost:3001/health (each service)
- **Database**: Check data with psql/mongosh commands above
- **Kafka**: Verify topics and messages with kafka-console-consumer
- **GitHub Issues**: Open an issue with logs and error details

## Useful Commands Cheat Sheet

```bash
# Start
docker-compose up -d --build

# Stop
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Restart service
docker-compose restart [service-name]

# Rebuild service
docker-compose up -d --build [service-name]

# Clean everything
docker-compose down -v
docker system prune -a

# Check status
docker-compose ps

# Execute command in container
docker exec -it [container-name] [command]

# View service ports
docker-compose ps | grep "ports"
```

---

You're all set! 🚀 Start building amazing features on SmartAutoCheck!
