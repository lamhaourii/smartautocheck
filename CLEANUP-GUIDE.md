# 🧹 SmartAutoCheck - Cleanup & Refactoring Guide

This guide will help you clean up the old architecture and keep only the new consolidated services.

---

## 📊 Current Situation

**Old Architecture (10 services)** → **New Architecture (5 services)**

We consolidated services to reduce complexity and improve maintainability.

---

## ❌ Step 1: DELETE Old Services

### Services to Delete (7 services)

These services have been merged into consolidated services:

```bash
cd services

# DELETE - Merged into inspection-certification-service
rm -rf certificate-service
rm -rf inspection-service

# DELETE - Merged into payment-invoice-service
rm -rf invoice-service
rm -rf payment-service

# DELETE - Functionality moved to shared/notifications library
rm -rf notification-service

# DELETE - Not part of core MVP
rm -rf chatbot-service
rm -rf document-service
```

**Windows PowerShell commands:**
```powershell
cd services

# Delete old services
Remove-Item -Recurse -Force certificate-service
Remove-Item -Recurse -Force inspection-service
Remove-Item -Recurse -Force invoice-service
Remove-Item -Recurse -Force payment-service
Remove-Item -Recurse -Force notification-service
Remove-Item -Recurse -Force chatbot-service
Remove-Item -Recurse -Force document-service
```

---

## ✅ Step 2: KEEP These Services (5 services)

**Do NOT delete these - they are the new consolidated architecture:**

1. ✅ **user-service** (v2.0 - Enhanced with refresh tokens, password reset)
2. ✅ **appointment-service** (v2.0 - Enhanced with reminders, conflict detection)
3. ✅ **payment-invoice-service** (NEW - Consolidated payment + invoice)
4. ✅ **inspection-certification-service** (NEW - Consolidated inspection + certificate)
5. ✅ **api-gateway** (v2.0 - Enhanced with circuit breakers, versioning)

---

## 📁 Step 3: Clean Up Documentation

### Duplicate Documentation Files to Delete

You have many duplicate documentation files. Keep only the essential ones:

**DELETE these duplicates:**
```powershell
# Navigate to project root
cd c:\Users\hp\Desktop\2A\sys dirst\smartautocheck

# Delete duplicate/outdated docs
Remove-Item COMPLETION-REPORT.md
Remove-Item FINAL-DELIVERY-SUMMARY.md
Remove-Item FRONTEND-REDESIGN-SUMMARY.md
Remove-Item IMPLEMENTATION-COMPLETE.md
Remove-Item IMPLEMENTATION-STATUS.md
Remove-Item PROJECT-SUMMARY.md
Remove-Item README-REFACTORED.md
Remove-Item QUICKSTART.md  # Keep QUICK-START.md instead
Remove-Item REFACTORING-GUIDE.md  # We're creating CLEANUP-GUIDE.md instead
```

**KEEP these essential docs:**
- ✅ **README.md** (or README-NEW.md - pick one, delete the other)
- ✅ **ARCHITECTURE.md** - System architecture
- ✅ **GETTING-STARTED.md** - Quick start guide
- ✅ **DEPLOYMENT-GUIDE.md** - Production deployment
- ✅ **QUICK-START.md** - Quick reference
- ✅ **API-ENDPOINTS.md** - API documentation
- ✅ **IMPLEMENTATION-SUMMARY.md** - What was built
- ✅ **REFACTORING-PROGRESS.md** - Progress tracking
- ✅ **SESSION-COMPLETE.md** - Completion summary
- ✅ **WHATS-NEXT.md** - Future roadmap
- ✅ **FINAL-STATUS.md** - Current status
- ✅ **CLEANUP-GUIDE.md** (this file)

---

## 🔄 Step 4: Update docker-compose.yml

Your current `docker-compose.yml` still references old services. Replace it with the new version:

**Option A: Use the production compose file**
```powershell
# Rename old file as backup
Rename-Item docker-compose.yml docker-compose.OLD.yml

# Use production compose as main
Copy-Item docker-compose-production.yml docker-compose.yml
```

**Option B: Manually edit docker-compose.yml**

Remove these service entries:
- ❌ certificate-service
- ❌ inspection-service
- ❌ invoice-service
- ❌ payment-service
- ❌ notification-service
- ❌ chatbot-service
- ❌ document-service

Keep only:
- ✅ user-service
- ✅ appointment-service
- ✅ payment-invoice-service
- ✅ inspection-certification-service
- ✅ api-gateway
- ✅ All infrastructure services (postgres, kafka, redis, etc.)
- ✅ Observability stack (prometheus, grafana, loki, jaeger)
- ✅ frontend

---

## 🗄️ Step 5: Update Database Migrations

Check your `database/migrations/` folder and ensure you have migrations for the new consolidated tables:

**Required tables for new architecture:**
- users
- appointments
- payments
- invoices
- inspections
- certificates
- refresh_tokens

If you have old migration files referencing deleted services, you can:
1. Keep them for historical reference
2. Or consolidate into new migration files

---

## 📦 Step 6: Clean Up node_modules

```powershell
# Remove all node_modules to save space
Get-ChildItem -Path . -Recurse -Directory -Filter "node_modules" | Remove-Item -Recurse -Force

# Then reinstall only for services you're keeping
cd services\user-service
npm install

cd ..\appointment-service
npm install

cd ..\payment-invoice-service
npm install

cd ..\inspection-certification-service
npm install

cd ..\api-gateway
npm install

cd ..\..\frontend
npm install

cd ..\database
npm install

cd ..\shared\notifications
npm install
```

---

## 🎯 Step 7: Final Verification

### Verify Service Structure

After cleanup, your `services/` folder should contain ONLY:
```
services/
├── api-gateway/
├── appointment-service/
├── inspection-certification-service/
├── payment-invoice-service/
├── user-service/
└── init-db.sql
```

### Verify Documentation

Your root folder documentation should be:
```
smartautocheck/
├── README.md (choose one)
├── ARCHITECTURE.md
├── API-ENDPOINTS.md
├── CLEANUP-GUIDE.md
├── DEPLOYMENT-GUIDE.md
├── FINAL-STATUS.md
├── GETTING-STARTED.md
├── IMPLEMENTATION-SUMMARY.md
├── QUICK-START.md
├── REFACTORING-PROGRESS.md
├── SESSION-COMPLETE.md
└── WHATS-NEXT.md
```

---

## 🚀 Step 8: Test the Cleaned System

```powershell
# 1. Start infrastructure
docker-compose up -d postgres kafka zookeeper redis

# Wait 30 seconds for infrastructure to be ready

# 2. Run migrations
cd database
npm run migrate:latest
npm run seed:run

# 3. Start services
cd ..
docker-compose up -d user-service
docker-compose up -d appointment-service
docker-compose up -d payment-invoice-service
docker-compose up -d inspection-certification-service
docker-compose up -d api-gateway

# 4. Start frontend
docker-compose up -d frontend

# 5. Start observability (optional)
docker-compose up -d prometheus grafana loki jaeger
```

### Verify Everything Works

```powershell
# Check health of all services
curl http://localhost:3000/health  # API Gateway (should show all services)
curl http://localhost:3001/health/live  # User Service
curl http://localhost:3002/health/live  # Appointment Service
curl http://localhost:3004/health/live  # Payment-Invoice Service
curl http://localhost:3005/health/live  # Inspection-Certification Service

# Check frontend
curl http://localhost:3010

# Check Grafana
# Open browser: http://localhost:3006
```

---

## 📋 Complete Cleanup Checklist

Run this complete script to clean everything:

```powershell
# Navigate to project root
cd "c:\Users\hp\Desktop\2A\sys dirst\smartautocheck"

# ========================================
# STEP 1: Delete Old Services
# ========================================
Write-Host "🗑️  Deleting old services..." -ForegroundColor Yellow

Remove-Item -Recurse -Force services\certificate-service -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force services\inspection-service -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force services\invoice-service -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force services\payment-service -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force services\notification-service -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force services\chatbot-service -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force services\document-service -ErrorAction SilentlyContinue

Write-Host "✅ Old services deleted" -ForegroundColor Green

# ========================================
# STEP 2: Delete Duplicate Documentation
# ========================================
Write-Host "🗑️  Deleting duplicate documentation..." -ForegroundColor Yellow

Remove-Item COMPLETION-REPORT.md -ErrorAction SilentlyContinue
Remove-Item FINAL-DELIVERY-SUMMARY.md -ErrorAction SilentlyContinue
Remove-Item FRONTEND-REDESIGN-SUMMARY.md -ErrorAction SilentlyContinue
Remove-Item IMPLEMENTATION-COMPLETE.md -ErrorAction SilentlyContinue
Remove-Item IMPLEMENTATION-STATUS.md -ErrorAction SilentlyContinue
Remove-Item PROJECT-SUMMARY.md -ErrorAction SilentlyContinue
Remove-Item README-REFACTORED.md -ErrorAction SilentlyContinue
Remove-Item QUICKSTART.md -ErrorAction SilentlyContinue
Remove-Item REFACTORING-GUIDE.md -ErrorAction SilentlyContinue
Remove-Item PAYPAL-INTEGRATION.md -ErrorAction SilentlyContinue
Remove-Item PROGRESS-UPDATE-FINAL.md -ErrorAction SilentlyContinue

Write-Host "✅ Duplicate docs deleted" -ForegroundColor Green

# ========================================
# STEP 3: Backup Old Docker Compose
# ========================================
Write-Host "📦 Backing up old docker-compose..." -ForegroundColor Yellow

if (Test-Path docker-compose.yml) {
    Copy-Item docker-compose.yml docker-compose.OLD.yml
    Write-Host "✅ Backup created: docker-compose.OLD.yml" -ForegroundColor Green
}

# ========================================
# STEP 4: List Remaining Services
# ========================================
Write-Host "`n📁 Remaining services:" -ForegroundColor Cyan
Get-ChildItem -Path services -Directory | Select-Object Name | Format-Table

# ========================================
# STEP 5: List Remaining Documentation
# ========================================
Write-Host "📄 Remaining documentation:" -ForegroundColor Cyan
Get-ChildItem -Path . -Filter "*.md" | Select-Object Name | Format-Table

Write-Host "`n✨ Cleanup complete! Your project now has the clean, consolidated architecture." -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review docker-compose.yml to ensure it has only the 5 new services" -ForegroundColor White
Write-Host "2. Run: docker-compose up -d" -ForegroundColor White
Write-Host "3. Run migrations: cd database && npm run migrate:latest" -ForegroundColor White
Write-Host "4. Access frontend: http://localhost:3010" -ForegroundColor White
```

---

## 🎯 After Cleanup

Your final structure will be:

```
smartautocheck/
├── services/
│   ├── api-gateway/              ✅ Keep
│   ├── appointment-service/      ✅ Keep
│   ├── inspection-certification-service/  ✅ Keep
│   ├── payment-invoice-service/  ✅ Keep
│   └── user-service/             ✅ Keep
├── frontend/                     ✅ Keep
├── database/                     ✅ Keep
├── infrastructure/               ✅ Keep
├── shared/                       ✅ Keep
├── docker-compose.yml           ✅ Keep (updated)
├── docker-compose-production.yml ✅ Keep
└── [Essential documentation]     ✅ Keep
```

**Result**: Clean, maintainable, production-ready codebase with 5 services instead of 10!

---

## ⚠️ Important Notes

1. **Backup First**: Before running the cleanup script, consider backing up the entire project:
   ```powershell
   cd "c:\Users\hp\Desktop\2A\sys dirst"
   Copy-Item -Recurse smartautocheck smartautocheck-backup
   ```

2. **Git Commit**: If using Git, commit the cleanup:
   ```bash
   git add .
   git commit -m "refactor: consolidate microservices from 10 to 5"
   ```

3. **Test Thoroughly**: After cleanup, test all functionality to ensure nothing is broken

4. **Update CI/CD**: If you have CI/CD pipelines, update them to remove references to deleted services

---

## 🎊 You're Done!

After running this cleanup, you'll have:
- ✅ **5 consolidated services** instead of 10
- ✅ **Clean documentation** without duplicates
- ✅ **Updated docker-compose**
- ✅ **Professional, maintainable codebase**
- ✅ **Ready for production deployment**

**Next**: Follow `DEPLOYMENT-GUIDE.md` to deploy to production!
