# SmartAutoCheck - Automated Cleanup Script
# This script removes old services and duplicate documentation

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SmartAutoCheck - Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Confirm before proceeding
$confirmation = Read-Host "This will DELETE old services and duplicate docs. Continue? (yes/no)"
if ($confirmation -ne 'yes') {
    Write-Host "Cleanup cancelled" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Starting cleanup..." -ForegroundColor Yellow
Write-Host ""

# ========================================
# STEP 1: Delete Old Services
# ========================================
Write-Host "Step 1: Deleting old services..." -ForegroundColor Magenta

$oldServices = @(
    "certificate-service",
    "inspection-service",
    "invoice-service",
    "payment-service",
    "notification-service",
    "chatbot-service",
    "document-service"
)

foreach ($service in $oldServices) {
    $servicePath = "services\$service"
    if (Test-Path $servicePath) {
        Remove-Item -Recurse -Force $servicePath
        Write-Host "  Deleted: $service" -ForegroundColor Green
    } else {
        Write-Host "  Not found: $service" -ForegroundColor Gray
    }
}

Write-Host ""

# ========================================
# STEP 2: Delete Duplicate Documentation
# ========================================
Write-Host "Step 2: Deleting duplicate documentation..." -ForegroundColor Magenta

$duplicateDocs = @(
    "COMPLETION-REPORT.md",
    "FINAL-DELIVERY-SUMMARY.md",
    "FRONTEND-REDESIGN-SUMMARY.md",
    "IMPLEMENTATION-COMPLETE.md",
    "IMPLEMENTATION-STATUS.md",
    "PROJECT-SUMMARY.md",
    "README-REFACTORED.md",
    "QUICKSTART.md",
    "REFACTORING-GUIDE.md",
    "PAYPAL-INTEGRATION.md",
    "PROGRESS-UPDATE-FINAL.md"
)

foreach ($doc in $duplicateDocs) {
    if (Test-Path $doc) {
        Remove-Item $doc
        Write-Host "  Deleted: $doc" -ForegroundColor Green
    } else {
        Write-Host "  Not found: $doc" -ForegroundColor Gray
    }
}

Write-Host ""

# ========================================
# STEP 3: Backup Old Docker Compose
# ========================================
Write-Host "Step 3: Backing up old docker-compose.yml..." -ForegroundColor Magenta

if (Test-Path "docker-compose.yml") {
    Copy-Item "docker-compose.yml" "docker-compose.OLD.yml"
    Write-Host "  Backup created: docker-compose.OLD.yml" -ForegroundColor Green
} else {
    Write-Host "  docker-compose.yml not found" -ForegroundColor Gray
}

Write-Host ""

# ========================================
# STEP 4: Display Results
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Remaining Services:" -ForegroundColor Yellow
if (Test-Path "services") {
    Get-ChildItem -Path "services" -Directory | ForEach-Object {
        Write-Host "  $($_.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Essential Documentation:" -ForegroundColor Yellow
$essentialDocs = @(
    "README.md",
    "ARCHITECTURE.md",
    "API-ENDPOINTS.md",
    "CLEANUP-GUIDE.md",
    "DEPLOYMENT-GUIDE.md",
    "FINAL-STATUS.md",
    "GETTING-STARTED.md",
    "IMPLEMENTATION-SUMMARY.md",
    "QUICK-START.md",
    "REFACTORING-PROGRESS.md",
    "SESSION-COMPLETE.md",
    "WHATS-NEXT.md"
)

foreach ($doc in $essentialDocs) {
    if (Test-Path $doc) {
        Write-Host "  $doc" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Review docker-compose.yml (or use docker-compose-production.yml)" -ForegroundColor White
Write-Host "2. Run database migrations:" -ForegroundColor White
Write-Host "   cd database" -ForegroundColor Gray
Write-Host "   npm install" -ForegroundColor Gray
Write-Host "   npm run migrate:latest" -ForegroundColor Gray
Write-Host "   npm run seed:run" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start services:" -ForegroundColor White
Write-Host "   docker-compose up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Access your application:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3010" -ForegroundColor Gray
Write-Host "   API Gateway: http://localhost:3000" -ForegroundColor Gray
Write-Host "   Grafana: http://localhost:3006" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Your project is now clean and ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""