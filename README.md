# BIZPOS - Multi-Tenant POS SaaS Platform

A cloud-based Point of Sale system for restaurants, cafes, and retail businesses with complete multi-tenant architecture.

## Documentation

| Document | Description |
|----------|-------------|
| [FEATURES.md](./FEATURES.md) | Complete feature documentation |
| [SETUP.md](./SETUP.md) | Setup instructions & credentials |

## Quick Start

```powershell
# Automated start (recommended)
.\start.ps1

# Or manually:
pnpm install
pnpm run dev
```

## Test Credentials

| Role | Employee ID | PIN | Email |
|------|-------------|-----|-------|
| Owner | EMP-001 | 1234 | admin@demo.com |
| Manager | EMP-002 | 9999 | manager@demo.com |
| Cashier | EMP-003 | 5678 | cashier@demo.com |

**Tenant Subdomain:** `demo` | **Password:** `password123`

## Application URLs

| App | URL | Description |
|-----|-----|-------------|
| POS Terminal | http://localhost:5173 | Point of sale interface |
| Admin Portal | http://localhost:5174 | Tenant admin dashboard |
| Owner Portal | http://localhost:5175 | SaaS owner control panel |
| Backend API | http://localhost:3000 | NestJS REST API |

## Project Structure

```
pos-saas/
├── apps/
│   ├── backend/           # NestJS API (port 3000)
│   ├── admin-portal/      # Tenant Admin Dashboard (port 5174)
│   ├── pos-terminal/      # POS Terminal (port 5173)
│   ├── owner-portal/      # SaaS Owner Dashboard (port 5175)
│   └── desktop/           # Electron wrapper for POS
│
├── packages/
│   ├── types/             # Shared TypeScript types
│   ├── ui/                # Shared React components
│   └── api-client/        # Shared API client utilities
│
├── FEATURES.md            # Feature documentation
├── SETUP.md               # Setup guide & credentials
└── README.md              # This file
```

## Key Features

- **Multi-Tenant Architecture** - Complete data isolation with tenant subdomain
- **Authentication** - PIN login for POS, Email/Password for admin
- **Role-Based Access** - Owner, Manager, Cashier, Kitchen roles
- **Admin Portal** - Categories, Products, Modifiers, Combos management
- **POS Terminal** - Touch-friendly interface for order processing
- **Owner Portal** - SaaS platform management
- **Desktop App** - Electron wrapper for offline-capable POS
- **Location Management** - Multi-location support with entity associations

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| Backend | NestJS, TypeScript, Prisma, PostgreSQL |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Desktop | Electron |
| Monorepo | pnpm, Turborepo |

## Status: Production-Ready

For detailed feature documentation, see [FEATURES.md](./FEATURES.md).  
For setup instructions and troubleshooting, see [SETUP.md](./SETUP.md).
