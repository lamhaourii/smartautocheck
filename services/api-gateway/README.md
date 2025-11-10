# API Gateway v2.0 - Enhanced

Enhanced API Gateway with versioning, circuit breakers, health aggregation, and correlation tracking.

## 🆕 What's New in v2.0

- ✅ **API Versioning** - Support for `/api/v1/...` routes
- ✅ **Circuit Breakers** - Opossum circuit breakers for all downstream services
- ✅ **Correlation IDs** - Request tracking across services
- ✅ **Health Aggregation** - Aggregated health checks from all services
- ✅ **Enhanced Logging** - Structured logs with correlation IDs
- ✅ **Fallback Responses** - Graceful degradation when services unavailable

## Features

### API Versioning
All routes support versioned endpoints:
```
/api/v1/auth/login
/api/v1/appointments
/api/v1/payments
```

Default version: `v1` (if not specified)

### Circuit Breakers
Prevents cascading failures with:
- **Timeout**: 5 seconds
- **Error Threshold**: 50% failure rate
- **Reset Timeout**: 30 seconds (try again after)
- **Volume Threshold**: 5 minimum requests

**States**:
- **Closed**: Normal operation
- **Open**: All requests fail fast with fallback
- **Half-Open**: Testing if service recovered

**Protected Services**:
- user-service
- appointment-service
- payment-invoice-service
- inspection-certification-service

### Correlation IDs
Every request gets a unique correlation ID:
- Auto-generated if not provided
- Propagated to downstream services
- Included in logs and responses
- Header: `X-Correlation-ID`

### Health Aggregation
Three health endpoints:

1. **Liveness** (`/health/live`): Is gateway running?
2. **Readiness** (`/health/ready`): Can gateway handle requests?
3. **Detailed** (`/health`): Full status of all services

## API Endpoints

### Health Checks
```
GET /health           - Detailed health with all services
GET /health/live      - Liveness probe
GET /health/ready     - Readiness probe
```

### Proxy Routes (v1)
```
# User Service
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/forgot-password
GET    /api/v1/auth/profile

# Appointment Service
POST   /api/v1/appointments
GET    /api/v1/appointments/:id
PUT    /api/v1/appointments/:id
DELETE /api/v1/appointments/:id/cancel
GET    /api/v1/appointments/slots/:date

# Payment & Invoice Service
POST   /api/v1/payments
POST   /api/v1/payments/capture
GET    /api/v1/payments/:id
GET    /api/v1/invoices/:id
GET    /api/v1/invoices/:id/download

# Inspection & Certification Service
POST   /api/v1/inspections/start
POST   /api/v1/inspections/:id/checkpoint
POST   /api/v1/inspections/:id/complete
GET    /api/v1/certificates/:id
GET    /api/v1/certificates/verify/:number
```

## Usage Examples

### Request with Correlation ID
```javascript
const response = await fetch('/api/v1/appointments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token',
    'X-Correlation-ID': 'custom-id-123' // Optional
  },
  body: JSON.stringify({...})
});

// Response includes correlation ID
const correlationId = response.headers.get('X-Correlation-ID');
```

### Check System Health
```javascript
const response = await fetch('/health');
const health = await response.json();

console.log(health.status); // 'healthy', 'degraded', or 'unhealthy'
console.log(health.downstream.summary); // { total: 4, healthy: 4, unhealthy: 0 }
console.log(health.circuitBreakers); // Circuit breaker states
```

### Version-specific Requests
```javascript
// V1 API
fetch('/api/v1/auth/login', {...});

// Future V2 API
fetch('/api/v2/auth/login', {...});
```

## Circuit Breaker Behavior

### Normal Flow (Circuit Closed)
```
Client → API Gateway → Service → Response
```

### When Service Fails (Circuit Opens)
```
Client → API Gateway → Fallback Response (503)
                    ↓
            Service (not called)
```

### After Reset Timeout (Circuit Half-Open)
```
Client → API Gateway → Service (test request)
                    ↓
            Success? → Circuit Closed
            Failure? → Circuit Remains Open
```

## Health Check Response

### Healthy System
```json
{
  "status": "healthy",
  "service": "api-gateway",
  "version": "2.0.0",
  "downstream": {
    "services": [
      {
        "name": "user-service",
        "status": "healthy",
        "responseTime": "45ms"
      },
      ...
    ],
    "summary": {
      "total": 4,
      "healthy": 4,
      "unhealthy": 0
    }
  },
  "circuitBreakers": {
    "userService": {
      "state": "closed",
      "stats": {...}
    },
    ...
  }
}
```

### Degraded System
```json
{
  "status": "degraded",
  "downstream": {
    "summary": {
      "total": 4,
      "healthy": 3,
      "unhealthy": 1
    }
  }
}
```

## Environment Variables

```env
# Service URLs
USER_SERVICE_URL=http://user-service:3001
APPOINTMENT_SERVICE_URL=http://appointment-service:3002
PAYMENT_INVOICE_SERVICE_URL=http://payment-invoice-service:3004
INSPECTION_CERTIFICATION_SERVICE_URL=http://inspection-certification-service:3005

# Circuit Breaker
CIRCUIT_BREAKER_TIMEOUT=5000
CIRCUIT_BREAKER_ERROR_THRESHOLD=50
CIRCUIT_BREAKER_RESET_TIMEOUT=30000
```

## Monitoring

### Circuit Breaker Events
```javascript
// Logged automatically:
- Circuit opened (service down)
- Circuit half-open (testing recovery)
- Circuit closed (service recovered)
- Request failures
- Request timeouts
- Fallbacks triggered
```

### Request Logging
Every request logged with:
- Correlation ID
- Method & path
- Status code
- Duration
- Timestamp

## Benefits

### Resilience
- **Fast failures**: No waiting for timeoutswhen service is down
- **Self-healing**: Auto-retry after reset timeout
- **Graceful degradation**: Fallback responses

### Observability
- **Request tracing**: Follow requests across services
- **Centralized monitoring**: Single health endpoint
- **Circuit breaker stats**: Real-time service status

### Flexibility
- **API versioning**: Support multiple API versions
- **Easy routing**: Version-specific logic
- **Backward compatibility**: Old clients still work

## Testing

```bash
# Test health aggregation
curl http://localhost:3000/health

# Test circuit breaker (simulate service down)
docker stop user-service
curl http://localhost:3000/api/v1/auth/profile
# Returns fallback response immediately

# Test correlation ID
curl -H "X-Correlation-ID: test-123" http://localhost:3000/api/v1/appointments
# Response includes X-Correlation-ID: test-123
```

## Production Checklist

- [ ] Configure service URLs
- [ ] Set circuit breaker thresholds
- [ ] Configure rate limiting
- [ ] Setup monitoring/alerting for circuit breakers
- [ ] Test fallback responses
- [ ] Verify health checks
- [ ] Test API versioning

## License

MIT
