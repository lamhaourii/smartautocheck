# SmartAutoCheck - Production Deployment Guide

Complete guide to deploy SmartAutoCheck to production.

## 📋 Prerequisites

- Docker & Docker Compose installed
- Domain name configured
- SSL certificates (Let's Encrypt recommended)
- Server with minimum 8GB RAM, 4 CPU cores
- PostgreSQL 15+
- Node.js 18+ (for local development)

---

## 🚀 Quick Deploy (Docker Compose)

### Step 1: Clone and Configure

```bash
# Clone repository
git clone https://github.com/your-org/smartautocheck.git
cd smartautocheck

# Create environment file
cp .env.example .env
```

### Step 2: Configure Environment Variables

Edit `.env`:

```env
# Database
POSTGRES_PASSWORD=your_secure_password_here
DATABASE_URL=postgresql://smartautocheck:your_secure_password_here@postgres:5432/smartautocheck_db

# JWT Secrets
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Frontend
FRONTEND_URL=https://smartautocheck.com
API_GATEWAY_URL=https://api.smartautocheck.com

# PayPal (Production)
PAYPAL_CLIENT_ID=your_live_paypal_client_id
PAYPAL_CLIENT_SECRET=your_live_paypal_secret
PAYPAL_MODE=live

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@smartautocheck.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Certificate Signing
CERTIFICATE_SECRET=your_certificate_signing_secret_key

# Monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=change_this_password

# Node Environment
NODE_ENV=production
LOG_LEVEL=info
```

### Step 3: Run Database Migrations

```bash
cd database
npm install
npm run migrate:latest
npm run seed:run  # Optional: seed with demo data
```

### Step 4: Build and Start Services

```bash
# Build all services
docker-compose -f docker-compose-production.yml build

# Start all services
docker-compose -f docker-compose-production.yml up -d

# Check status
docker-compose -f docker-compose-production.yml ps

# View logs
docker-compose -f docker-compose-production.yml logs -f
```

### Step 5: Verify Deployment

```bash
# Health checks
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health/live  # User Service
curl http://localhost:3002/health/live  # Appointment Service
curl http://localhost:3004/health/live  # Payment Service
curl http://localhost:3005/health/live  # Inspection Service

# Frontend
curl http://localhost:3010
```

---

## 🌐 Domain Setup

### DNS Configuration

Point your domains to your server:

```
A     smartautocheck.com           -> YOUR_SERVER_IP
A     www.smartautocheck.com       -> YOUR_SERVER_IP
A     api.smartautocheck.com       -> YOUR_SERVER_IP
CNAME grafana.smartautocheck.com  -> smartautocheck.com
```

### Nginx Configuration

Create `/etc/nginx/sites-available/smartautocheck`:

```nginx
# Frontend
server {
    listen 80;
    server_name smartautocheck.com www.smartautocheck.com;
    
    location / {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API Gateway
server {
    listen 80;
    server_name api.smartautocheck.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Grafana
server {
    listen 80;
    server_name grafana.smartautocheck.com;
    
    location / {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/smartautocheck /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d smartautocheck.com -d www.smartautocheck.com
sudo certbot --nginx -d api.smartautocheck.com
sudo certbot --nginx -d grafana.smartautocheck.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

---

## 📊 Monitoring Setup

### Access Monitoring Dashboards

- **Grafana**: https://grafana.smartautocheck.com
  - Username: admin
  - Password: (from .env GRAFANA_ADMIN_PASSWORD)

- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686
- **Kafka UI**: http://localhost:8080

### Configure Grafana Dashboards

1. Login to Grafana
2. Add Prometheus data source:
   - URL: http://prometheus:9090
3. Import dashboards from `infrastructure/grafana/dashboards/`
4. Set up alerts

---

## 🔒 Security Checklist

### Pre-Production Security

- [ ] Change all default passwords
- [ ] Generate strong JWT secrets (min 32 characters)
- [ ] Configure firewall (ufw)
- [ ] Enable SSL/TLS
- [ ] Set up CORS whitelist
- [ ] Configure rate limiting
- [ ] Enable database SSL
- [ ] Set up backup strategy
- [ ] Configure log rotation
- [ ] Enable security headers (Helmet.js)
- [ ] Set up intrusion detection
- [ ] Review exposed ports

### Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable
```

### Database Security

```sql
-- Restrict database access
-- In PostgreSQL, edit pg_hba.conf:
host    smartautocheck_db    smartautocheck    10.0.0.0/8    md5

-- Use strong password
ALTER USER smartautocheck WITH PASSWORD 'very_strong_password';
```

---

## 💾 Backup Strategy

### Database Backups

Create backup script `/usr/local/bin/backup-smartautocheck.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/smartautocheck"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec smartautocheck-postgres pg_dump -U smartautocheck smartautocheck_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup certificates (if stored locally)
tar -czf $BACKUP_DIR/certificates_$DATE.tar.gz /path/to/certificates

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

Configure cron:
```bash
# Run daily at 2 AM
0 2 * * * /usr/local/bin/backup-smartautocheck.sh >> /var/log/smartautocheck-backup.log 2>&1
```

### Cloud Backups

Consider using:
- AWS S3 for file storage
- AWS RDS automated backups
- Azure Backup
- Google Cloud Storage

---

## 📈 Scaling Guide

### Horizontal Scaling

Scale specific services:

```bash
# Scale API Gateway to 3 instances
docker-compose -f docker-compose-production.yml up -d --scale api-gateway=3

# Scale Appointment Service to 2 instances
docker-compose -f docker-compose-production.yml up -d --scale appointment-service=2

# Scale Payment Service to 2 instances
docker-compose -f docker-compose-production.yml up -d --scale payment-invoice-service=2
```

### Load Balancer Configuration

Update Nginx for load balancing:

```nginx
upstream api_gateway {
    least_conn;
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    server_name api.smartautocheck.com;
    
    location / {
        proxy_pass http://api_gateway;
        # ... other settings
    }
}
```

### Database Replication

Already configured with master-slave setup in docker-compose.yml.

Read queries use slave:
```javascript
DATABASE_READ_URL=postgresql://smartautocheck:pass@postgres-slave:5432/smartautocheck_db
```

---

## 🔧 Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild services
docker-compose -f docker-compose-production.yml build

# Rolling update (zero downtime)
docker-compose -f docker-compose-production.yml up -d --no-deps --build api-gateway
docker-compose -f docker-compose-production.yml up -d --no-deps --build user-service
# ... repeat for other services
```

### Database Migrations

```bash
# Run new migrations
cd database
npm run migrate:latest

# Rollback if needed
npm run migrate:rollback
```

### View Logs

```bash
# All services
docker-compose -f docker-compose-production.yml logs -f

# Specific service
docker-compose -f docker-compose-production.yml logs -f user-service

# Last 100 lines
docker-compose -f docker-compose-production.yml logs --tail=100 api-gateway
```

### Health Monitoring

```bash
# Check all services
curl https://api.smartautocheck.com/health

# Get detailed metrics
curl https://api.smartautocheck.com/metrics
```

---

## 🚨 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs service-name

# Check if port is in use
sudo lsof -i :3000

# Restart service
docker-compose restart service-name
```

### Database Connection Issues

```bash
# Check PostgreSQL status
docker exec smartautocheck-postgres pg_isready

# Test connection
docker exec smartautocheck-postgres psql -U smartautocheck -d smartautocheck_db -c "SELECT 1"

# Check credentials
cat .env | grep POSTGRES
```

### High Memory Usage

```bash
# Check memory usage
docker stats

# Restart heavy services
docker-compose restart kafka
docker-compose restart postgres

# Clear Docker cache
docker system prune -a
```

### Kafka Issues

```bash
# Check Kafka status
docker exec smartautocheck-kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# List topics
docker exec smartautocheck-kafka kafka-topics --list --bootstrap-server localhost:9092

# View consumer groups
docker exec smartautocheck-kafka kafka-consumer-groups --list --bootstrap-server localhost:9092
```

---

## 📊 Performance Tuning

### PostgreSQL Optimization

Edit `postgresql.conf`:

```conf
# Connections
max_connections = 200

# Memory
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
work_mem = 16MB

# Checkpoints
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Query Planning
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Node.js Memory

Increase Node.js memory limit in Dockerfile:

```dockerfile
CMD ["node", "--max-old-space-size=2048", "src/index.js"]
```

### Redis Configuration

```bash
# Set max memory
docker exec smartautocheck-redis redis-cli CONFIG SET maxmemory 1gb
docker exec smartautocheck-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## 🎯 Production Checklist

### Before Go-Live

- [ ] All environment variables configured
- [ ] SSL certificates installed
- [ ] Database backed up
- [ ] Monitoring dashboards set up
- [ ] Log aggregation configured
- [ ] Rate limiting tested
- [ ] Load testing completed
- [ ] Security scan performed
- [ ] Backup strategy tested
- [ ] Error tracking set up (Sentry)
- [ ] DNS configured
- [ ] Email service tested
- [ ] SMS service tested
- [ ] Payment gateway tested (live mode)
- [ ] Documentation updated
- [ ] Team trained

### Day 1 Monitoring

- Monitor error rates
- Check response times
- Verify payment processing
- Test email/SMS delivery
- Monitor database performance
- Check disk space
- Verify backups running
- Monitor memory/CPU usage

---

## 📞 Support

### Emergency Contacts

- **DevOps Lead**: devops@smartautocheck.com
- **Database Admin**: dba@smartautocheck.com
- **Security Team**: security@smartautocheck.com

### Monitoring Alerts

Configure alerts in Grafana for:
- Service downtime
- High error rates
- High response times
- Circuit breaker open
- Database connection issues
- High memory/CPU usage
- Disk space < 20%

---

## 🔄 CI/CD Pipeline

GitHub Actions workflow is already configured in `.github/workflows/`.

### Manual Deploy

```bash
# Tag release
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will automatically:
# 1. Run tests
# 2. Build Docker images
# 3. Push to registry
# 4. Deploy to production
```

### Rollback

```bash
# Find previous working version
docker images smartautocheck-api-gateway

# Deploy specific version
docker-compose -f docker-compose-production.yml up -d api-gateway:v1.0.0
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Built with ❤️ for production reliability**
