# Quick Start - Frontend Only
Write-Host "[BIZPOS] Starting Frontend..." -ForegroundColor Cyan

Set-Location frontend

Write-Host "[SETUP] Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "[START] Starting frontend on http://localhost:5173..." -ForegroundColor Green
npm run dev
