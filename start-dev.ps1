# POS SaaS Monorepo Quick Start Script
# Run this to start the development environment

Write-Host "[POS-SAAS] Starting Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is running
Write-Host "[CHECK] Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    if ($pgService -and $pgService.Status -eq "Running") {
        Write-Host "[OK] PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "[WARN] PostgreSQL service not found or not running" -ForegroundColor Yellow
        Write-Host "Please ensure PostgreSQL is running" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARN] Could not check PostgreSQL status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[SETUP] Installing dependencies with pnpm..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install dependencies. Make sure pnpm is installed." -ForegroundColor Red
    Write-Host "Install pnpm: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "[START] Starting all services with Turbo..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Services will be available at:" -ForegroundColor Cyan
Write-Host "  Backend API:    http://localhost:3000" -ForegroundColor White
Write-Host "  Admin Portal:   http://localhost:5174" -ForegroundColor White
Write-Host "  POS Terminal:   http://localhost:5173" -ForegroundColor White
Write-Host "  Owner Portal:   http://localhost:5175" -ForegroundColor White
Write-Host ""

pnpm run dev
