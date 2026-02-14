# BIZPOS Quick Start Script
# Run this to start the entire application

Write-Host "[BIZPOS] Starting BIZPOS Application..." -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is running
Write-Host "[CHECK] Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    if ($pgService -and $pgService.Status -eq "Running") {
        Write-Host "[OK] PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] PostgreSQL service not found or not running" -ForegroundColor Red
        Write-Host "Please start PostgreSQL and try again" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[WARN] Could not check PostgreSQL status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[SETUP] Installing dependencies..." -ForegroundColor Yellow

# Backend dependencies
Write-Host "  Installing backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Frontend dependencies
Write-Host "  Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location ../frontend
npm install --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..
Write-Host "[OK] Dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "[DATABASE] Setting up database..." -ForegroundColor Yellow
Set-Location backend

# Check if database needs setup
Write-Host "  Running migrations..." -ForegroundColor Cyan
npx prisma migrate deploy --skip-generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Migration failed, database might not be set up" -ForegroundColor Yellow
}

Write-Host "  Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

Write-Host "  Seeding database..." -ForegroundColor Cyan
npm run prisma:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Seeding failed or data already exists" -ForegroundColor Yellow
}

Set-Location ..
Write-Host "[OK] Database ready" -ForegroundColor Green

Write-Host ""
Write-Host "[START] Starting services..." -ForegroundColor Yellow
Write-Host ""

# Start backend in background
Write-Host "  Starting backend on http://localhost:3000..." -ForegroundColor Cyan
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run start:dev" -PassThru -WindowStyle Normal

Start-Sleep -Seconds 3

# Start frontend in background
Write-Host "  Starting frontend on http://localhost:5173..." -ForegroundColor Cyan
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -PassThru -WindowStyle Normal

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "[SUCCESS] BIZPOS is now running!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "Backend:   http://localhost:3000/api" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Owner:    EMP-001 | PIN: 1234" -ForegroundColor White
Write-Host "  Manager:  EMP-002 | PIN: 9999" -ForegroundColor White
Write-Host "  Cashier:  EMP-003 | PIN: 5678" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tenant: demo" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Wait for user to press Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "[STOP] Stopping services..." -ForegroundColor Yellow
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Services stopped" -ForegroundColor Green
}
