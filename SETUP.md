# BIZPOS - Setup Guide

Complete setup instructions for the BIZPOS multi-tenant POS system.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Manual Setup](#manual-setup)
4. [Test Credentials](#test-credentials)
5. [Application URLs](#application-urls)
6. [Database Setup](#database-setup)
7. [Desktop Application](#desktop-application)
8. [Environment Variables](#environment-variables)
9. [Common Commands](#common-commands)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
| Software | Version | Download |
|----------|---------|----------|
| Node.js | 24.x or higher | [nodejs.org](https://nodejs.org) |
| pnpm | 8.x or higher | `npm install -g pnpm` |
| PostgreSQL | 14+ | [postgresql.org](https://www.postgresql.org/download/) |
| Git | Latest | [git-scm.com](https://git-scm.com) |

### Verify Installation
```powershell
node --version    # Should be v24.x.x
pnpm --version    # Should be 8.x.x or higher
psql --version    # PostgreSQL 14+
```

---

## Quick Start

### Option 1: Automated Start (Recommended)
```powershell
# From project root directory
.\start.ps1
```

This script will:
1. Install all dependencies
2. Set up the database
3. Run migrations
4. Seed test data
5. Start backend and frontend servers
6. Display test credentials

### Option 2: Start Individual Services
```powershell
# Backend only
.\start-backend.ps1

# Frontend (POS Terminal) only
.\start-frontend.ps1

# Desktop application
.\start-desktop.ps1
```

---

## Manual Setup

### Step 1: Install Dependencies
```powershell
# From project root
pnpm install
```

### Step 2: Database Setup
```powershell
# Create database (using psql)
psql -U postgres -c "CREATE DATABASE pos_saas;"

# Or using pgAdmin:
# 1. Open pgAdmin
# 2. Right-click Databases > Create > Database
# 3. Name: pos_saas
```

### Step 3: Environment Configuration
Create `.env` file in `apps/backend/`:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/pos_saas?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="8h"

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Step 4: Run Migrations
```powershell
cd apps/backend
npx prisma generate
npx prisma migrate deploy
```

### Step 5: Seed Database
```powershell
cd apps/backend
npm run prisma:seed
```

### Step 6: Start Services
```powershell
# Terminal 1 - Backend
cd apps/backend
npm run start:dev

# Terminal 2 - Frontend (POS Terminal)
cd apps/pos-terminal
npm run dev

# Terminal 3 - Admin Portal
cd apps/admin-portal
npm run dev

# Terminal 4 - Owner Portal
cd apps/owner-portal
npm run dev
```

---

## Test Credentials

### Default Tenant
| Field | Value |
|-------|-------|
| Subdomain | `demo` |
| Business Name | Demo Restaurant |
| Plan | Professional (Active) |

### Test Users

| Role | Employee ID | PIN | Email | Password |
|------|-------------|-----|-------|----------|
| **Owner** | EMP-001 | 1234 | admin@demo.com | password123 |
| **Manager** | EMP-002 | 9999 | manager@demo.com | password123 |
| **Cashier** | EMP-003 | 5678 | cashier@demo.com | password123 |

### Login Methods

### Owner Portal Login (http://localhost:5175):

Email: admin@demo.com
Password: password123

**POS Terminal (PIN Login):**
1. Open http://localhost:5173
2. Enter Employee ID: `EMP-001`
3. Enter PIN: `1234`
4. Click "SIGN IN"

**Admin Portal (Email Login):**
1. Open http://localhost:5174
2. Enter Email: `admin@demo.com`
3. Enter Password: `password123`
4. Click "Login"

---

## Application URLs

### Development Servers

| Application | URL | Description |
|-------------|-----|-------------|
| **POS Terminal** | http://localhost:5173 | Point of sale interface |
| **Admin Portal** | http://localhost:5174 | Tenant admin dashboard |
| **Owner Portal** | http://localhost:5175 | SaaS owner control panel |
| **Backend API** | http://localhost:3000 | NestJS REST API |
| **Prisma Studio** | http://localhost:5555 | Database GUI |

### API Base URL
```
http://localhost:3000/api
```

---

## Database Setup

### PostgreSQL Installation (Windows)

1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer, remember your password
3. Default port: 5432
4. Add to PATH: `C:\Program Files\PostgreSQL\16\bin`

### Create Database
```powershell
# Using psql
psql -U postgres -c "CREATE DATABASE pos_saas;"

# Enable UUID extension
psql -U postgres -d pos_saas -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

### Prisma Commands
```powershell
cd apps/backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset --force

# Seed database
npm run prisma:seed

# Open Prisma Studio (Database GUI)
npx prisma studio
```

### Connection String Format
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA

# Example
postgresql://postgres:mypassword@localhost:5432/pos_saas?schema=public
```

---

## Desktop Application

### Start Desktop App

**Automatic (Recommended):**
```powershell
.\start-desktop.ps1
```

**Manual:**
```powershell
# Ensure frontend is running first
cd apps/desktop

# If frontend is on port 5173 (default)
npm run electron

# If frontend is on different port (e.g., 5177)
$env:FRONTEND_URL="http://localhost:5177"
npm run electron
```

### Desktop Features
- Window size: 1400x900
- Auto-detects frontend port
- Development mode includes DevTools
- Secure WebPreferences enabled

---

## Environment Variables

### Backend (`apps/backend/.env`)
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/pos_saas?schema=public"

# JWT Authentication
JWT_SECRET="your-secret-key-min-32-characters"
JWT_EXPIRATION="8h"

# Server
PORT=3000
NODE_ENV=development

# CORS (comma-separated origins)
CORS_ORIGINS="http://localhost:5173,http://localhost:5174,http://localhost:5175"
```

### Frontend Apps
Frontend apps use Vite and typically don't require `.env` files for development. The API URL is configured in `src/config/api.ts`.

---

## Common Commands

### Package Management
```powershell
# Install all dependencies
pnpm install

# Add package to specific app
pnpm add <package> --filter <app-name>

# Update all packages
pnpm update
```

### Development
```powershell
# Start all apps
pnpm run dev

# Start specific app
pnpm run dev:backend
pnpm run dev:pos
pnpm run dev:admin
pnpm run dev:owner

# Build all apps
pnpm run build

# Lint all apps
pnpm run lint
```

### Database
```powershell
cd apps/backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed data
npm run prisma:seed

# Reset database
npm run db:reset

# Open database GUI
npm run prisma:studio
```

### Testing
```powershell
# Run backend tests
cd apps/backend
npm run test

# Run e2e tests
npm run test:e2e

# Test API endpoints
.\test-api-simple.ps1
```

---

## Troubleshooting

### Common Issues

#### 1. "Port already in use"
```powershell
# Find process using port (e.g., 3000)
netstat -ano | findstr ":3000"

# Kill process by PID
Stop-Process -Id <PID> -Force

# Or kill all Node processes
Get-Process -Name "node" | Stop-Process -Force
```

#### 2. "Cannot connect to database"
```powershell
# Check if PostgreSQL is running
Get-Service postgresql*

# Start PostgreSQL service
Start-Service postgresql-x64-16

# Verify connection
psql -U postgres -c "SELECT 1"
```

#### 3. "Prisma migration failed"
```powershell
cd apps/backend

# Reset and re-run migrations
npx prisma migrate reset --force

# Regenerate Prisma client
npx prisma generate
```

#### 4. "uuid_generate_v4() does not exist"
```powershell
# Enable UUID extension
psql -U postgres -d pos_saas -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

#### 5. "Module not found" errors
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
pnpm install
```

#### 6. "Frontend blank screen"
- Check browser console for errors
- Verify backend is running
- Check API URL configuration
- Clear browser cache

#### 7. "401 Unauthorized" errors
- Token may be expired, re-login
- Check `x-tenant-subdomain` header
- Verify JWT_SECRET matches

### Check Service Status
```powershell
# Check if backend is running
Invoke-RestMethod http://localhost:3000/api/health

# Check database connection
cd apps/backend
npx prisma db pull

# Check all ports
netstat -ano | findstr "3000 5173 5174 5175 5432"
```

### Logs
```powershell
# Backend logs (in dev mode)
cd apps/backend
npm run start:dev

# Check for TypeScript errors
npm run build
```

---

## Project Structure

```
pos-saas/
├── apps/
│   ├── backend/           # NestJS API (port 3000)
│   │   ├── src/
│   │   │   ├── auth/      # Authentication module
│   │   │   ├── categories/# Categories CRUD
│   │   │   ├── products/  # Products CRUD
│   │   │   ├── modifiers/ # Modifiers CRUD
│   │   │   ├── combos/    # Combos CRUD
│   │   │   └── menu/      # POS menu loader
│   │   └── prisma/        # Database schema
│   │
│   ├── admin-portal/      # Admin Dashboard (port 5174)
│   ├── pos-terminal/      # POS Terminal (port 5173)
│   ├── owner-portal/      # Owner Portal (port 5175)
│   └── desktop/           # Electron wrapper
│
├── packages/
│   ├── types/             # Shared TypeScript types
│   ├── ui/                # Shared React components
│   └── api-client/        # Shared API utilities
│
├── FEATURES.md            # Feature documentation
├── SETUP.md               # This file
└── README.md              # Project overview
```

---

## API Testing

### Using PowerShell
```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:3000/api/health"

# PIN Login
$body = @{
    employeeId = "EMP-001"
    pin = "1234"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/pin-login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"; "x-tenant-subdomain"="demo"} `
    -Body $body

# Use token for authenticated requests
$token = $response.accessToken
Invoke-RestMethod -Uri "http://localhost:3000/api/categories" `
    -Headers @{"Authorization"="Bearer $token"; "x-tenant-subdomain"="demo"}
```

### Using cURL
```bash
# Health check
curl http://localhost:3000/api/health

# PIN Login
curl -X POST http://localhost:3000/api/auth/pin-login \
  -H "Content-Type: application/json" \
  -H "x-tenant-subdomain: demo" \
  -d '{"employeeId":"EMP-001","pin":"1234"}'
```

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review [FEATURES.md](./FEATURES.md) for feature details
3. Check backend logs for error details
