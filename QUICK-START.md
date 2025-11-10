# SmartAutoCheck - Quick Start Guide

## 🚀 Get Running in 5 Minutes

This guide will get you from zero to a fully running distributed systems project in under 5 minutes.

---

## Prerequisites

✅ **Docker Desktop** installed and running  
✅ **8GB RAM** minimum available  
✅ **Git** installed  
✅ **Port availability**: 80, 3000-3010, 5432-5433, 6379, 8080, 8500, 9092, 16686

---

## Step 1: Apply Refactored Configuration (1 minute)

```bash
cd c:/Users/hp/Desktop/2A/sys\ dirst/smartautocheck

# Use refactored docker-compose
copy docker-compose.refactored.yml docker-compose.yml

# Use refactored API Gateway
copy services\api-gateway\src\index.refactored.js services\api-gateway\src\index.js

# Optional: Use refactored README
copy README-REFACTORED.md README.md
```

---

## Step 2: Start Everything (2 minutes)

```bash
# Build and start all services
docker-compose up --build -d

# Watch logs (optional)
docker-compose logs -f api-gateway

# Wait ~2 minutes for all services to initialize
# You'll see "✅ Service registered with Consul" messages
```

---

## Step 3: Verify It's Working (1 minute)

### Check All Containers Are Running
```bash
docker-compose ps

# Should show 15 containers:
# - 7 microservices (api-gateway, user, appointment, payment, inspection, certificate, notification)
# - 8 infrastructure (postgres, postgres-slave, mongo, redis, kafka, zookeeper, consul, jaeger, nginx, kafka-ui)
```

### Test API Health
```bash
curl http://localhost/health

# Should return:
# {
#   "status": "healthy",
#   "service": "api-gateway",
#   "dependencies": { ... },
#   "circuitBreakers": { ... }
# }
```

---

## Step 4: Open Dashboards (30 seconds)

```bash
# Application
start http://localhost:3010

# Jaeger (Distributed Tracing)
start http://localhost:16686

# Consul (Service Discovery)
start http://localhost:8500

# Kafka UI (Event Streaming)
start http://localhost:8080
```

**What to See:**

**Jaeger**: No traces yet (make API requests first)  
**Consul**: All 7 services registered and healthy  
**Kafka UI**: 6 topics ready (appointments, payments, inspections, certificates, notifications, users)  

---

## Step 5: Quick Demo (5 minutes)

### Demo 1: Service Discovery
```bash
# Scale appointment service to 3 instances
docker-compose up -d --scale appointment-service=3

# Check Consul UI
start http://localhost:8500/ui/dc1/services/appointment-service
# Should show 3 healthy instances

# Make appointment request
curl http://localhost/api/appointments/available?date=2024-12-31

# Gateway automatically load balances across all 3 instances
```

### Demo 2: Circuit Breaker
```bash
# Stop payment service (simulate failure)
docker-compose stop payment-service

# Try payment request
curl http://localhost/api/payments/create-order

# Should return fallback response in ~10ms (not timeout!)

# Check circuit breaker status
curl http://localhost/admin/circuit-breakers

# Restart service
docker-compose start payment-service

# Circuit auto-closes after 30s
```

### Demo 3: Distributed Tracing
```bash
# Make any request
curl http://localhost/api/appointments/available?date=2024-12-31

# Open Jaeger
start http://localhost:16686

# Search for service: "api-gateway"
# Click on a trace to see:
# - gateway → appointment-service
# - Timing breakdown
# - Request headers
```

### Demo 4: Rate Limiting (Advanced)
```bash
# Scale gateway to 3 instances
docker-compose up -d --scale api-gateway=3

# Install k6 for load testing
# Windows: choco install k6
# Mac: brew install k6

# Run rate limit test
k6 run load-tests/rate-limit-test.js

# Result: Exactly 100 succeed, 50 get 429
# Proves Redis-based rate limiting works across instances
```

---

## 🎯 What You Now Have Running

### Microservices (7)
1. **API Gateway** (Port 3000) - Circuit Breaker, Rate Limiting, Tracing
2. **User Service** (Port 3001) - Auth, JWT, Refresh Tokens
3. **Appointment Service** (Port 3002) - Booking, QR Codes
4. **Payment Service** (Port 3003) - PayPal, Invoices, Idempotency
5. **Inspection Service** (Port 3005) - WebSocket, Real-time Updates
6. **Certificate Service** (Port 3006) - PDF Generation
7. **Notification Service** (Port 3009) - Email, SMS

### Infrastructure (8)
1. **Nginx** (Port 80) - Load Balancer
2. **PostgreSQL Master** (Port 5432) - Write DB
3. **PostgreSQL Slave** (Port 5433) - Read DB
4. **MongoDB** (Port 27017) - Notification Logs
5. **Redis** (Port 6379) - Cache, Rate Limiting, Tokens
6. **Kafka + Zookeeper** (Port 9092) - Event Streaming
7. **Consul** (Port 8500) - Service Discovery
8. **Jaeger** (Port 16686) - Distributed Tracing
9. **Kafka UI** (Port 8080) - Event Monitoring

### Patterns Implemented (7+)
✅ Circuit Breaker  
✅ Service Discovery  
✅ Distributed Tracing  
✅ Distributed Rate Limiting  
✅ Load Balancing  
✅ Database Replication  
✅ Event-Driven Architecture  

---

## 📚 What to Read Next

### For Demo/Presentation
→ **`REFACTORING-GUIDE.md`** - Complete demo script with explanations

### For Development
→ **`IMPLEMENTATION-COMPLETE.md`** - All features and files

### For Understanding
→ **`README-REFACTORED.md`** - Architecture and patterns

### For Debugging
→ **`REFACTORING-GUIDE.md`** - Troubleshooting section

---

## 🔍 Common Issues

### Issue: Services won't start
```bash
# Check logs
docker-compose logs api-gateway

# Common fix: Clean slate
docker-compose down -v
docker-compose up --build -d
```

### Issue: Port already in use
```bash
# Windows: Find and kill process
netstat -ano | findstr :80
taskkill /PID <PID> /F

# Or change ports in docker-compose.yml
```

### Issue: Consul shows services unhealthy
```bash
# Wait 1-2 minutes - services retry registration
# Check individual service health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

### Issue: No traces in Jaeger
```bash
# Make some requests first
curl http://localhost/api/appointments/available?date=2024-12-31
curl http://localhost/health

# Then check Jaeger (takes 5-10 seconds to appear)
```

---

## 🎓 For Academic Presentation

### What to Show (15 minutes)
1. **Architecture** (2 min) - Open Consul, show all 7 services
2. **Scaling** (3 min) - Scale service, show in Consul
3. **Circuit Breaker** (3 min) - Stop service, show fallback
4. **Tracing** (3 min) - Make request, view in Jaeger
5. **Rate Limiting** (2 min) - Run k6 test, show results
6. **Q&A** (2 min)

### What to Explain
- **Why Circuit Breaker?** - Prevents cascading failures
- **Why Service Discovery?** - Dynamic scaling, no hardcoded URLs
- **Why Distributed Tracing?** - Debug failures across services
- **Why Redis Rate Limiting?** - Global enforcement across instances
- **Why Event-Driven?** - Loose coupling, scalability

---

## 📊 Load Testing

### Quick Load Test
```bash
# Install k6 first
k6 run load-tests/booking-flow.js

# Expected results:
# - http_req_duration p95: <500ms
# - http_req_failed: <10%
# - 18,000+ requests in 3 minutes
```

### Test Circuit Breaker
```bash
k6 run load-tests/circuit-breaker-demo.js

# During test (in another terminal):
# 1. Wait 30s
# 2. docker-compose stop payment-service
# 3. Wait 60s
# 4. docker-compose start payment-service
```

---

## 🛑 Stop Everything

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

---

## 🎉 You're All Set!

You now have a complete distributed systems project running with:
- ✅ 7 microservices
- ✅ 5+ distributed patterns
- ✅ 3 monitoring dashboards
- ✅ Real-time features
- ✅ Security features
- ✅ Load testing ready

**Next Steps:**
1. Explore the dashboards
2. Run the load tests
3. Practice your demo
4. Read the detailed guides

**Need Help?**
→ Check `REFACTORING-GUIDE.md` for troubleshooting  
→ View logs: `docker-compose logs -f service-name`  
→ Check health: `curl http://localhost/health`

---

**Good luck with your project! 🚀**
