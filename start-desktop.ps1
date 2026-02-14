# Quick Start - Desktop App
# This script checks if frontend is running and launches the desktop app

Write-Host "[BIZPOS DESKTOP] Starting Desktop Application..." -ForegroundColor Cyan
Write-Host ""

# Check if frontend is running on any port
Write-Host "[CHECK] Looking for frontend server..." -ForegroundColor Yellow

$frontendPort = $null
$portsToCheck = @(5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180)

foreach ($port in $portsToCheck) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port" -TimeoutSec 1 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $frontendPort = $port
            Write-Host "[OK] Frontend found on port $port" -ForegroundColor Green
            break
        }
    } catch {
        # Port not available, continue
    }
}

if ($null -eq $frontendPort) {
    Write-Host "[ERROR] Frontend is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the frontend first:" -ForegroundColor Yellow
    Write-Host "  1. Open a new terminal" -ForegroundColor White
    Write-Host "  2. Run: cd frontend" -ForegroundColor White
    Write-Host "  3. Run: npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use the full start script:" -ForegroundColor Yellow
    Write-Host "  .\start.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "[SETUP] Installing desktop dependencies..." -ForegroundColor Yellow
Set-Location desktop
npm install --silent

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Dependencies installed" -ForegroundColor Green
Write-Host ""
Write-Host "[START] Launching desktop app..." -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend URL: http://localhost:$frontendPort" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set the frontend URL and launch electron
$env:FRONTEND_URL = "http://localhost:$frontendPort"
npm run electron
