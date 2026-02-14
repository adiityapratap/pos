# Quick Start - Backend Only
Write-Host "[BIZPOS] Starting Backend..." -ForegroundColor Cyan

Set-Location backend

Write-Host "[SETUP] Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "[DATABASE] Setting up database..." -ForegroundColor Yellow
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed

Write-Host "[START] Starting backend on http://localhost:3000..." -ForegroundColor Green
npm run start:dev
