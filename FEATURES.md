# BIZPOS - Features Documentation

## Overview

**BIZPOS** is a multi-tenant, cloud-based Point of Sale (POS) system designed for restaurants, cafes, and retail businesses. This document details all implemented features across the platform.

---

## Table of Contents

1. [Multi-Tenant Architecture](#1-multi-tenant-architecture)
2. [Authentication System](#2-authentication-system)
3. [Role-Based Access Control (RBAC)](#3-role-based-access-control-rbac)
4. [Admin Portal](#4-admin-portal)
5. [POS Terminal](#5-pos-terminal)
6. [Owner Portal](#6-owner-portal)
7. [Menu Management System](#7-menu-management-system)
8. [Location Management](#8-location-management)
9. [Desktop Application](#9-desktop-application)
10. [API Architecture](#10-api-architecture)

---

## 1. Multi-Tenant Architecture

### Strategy
- **Single Database, Shared Schema with Tenant ID**
- Every table includes a `tenant_id` column for complete data isolation
- Tenant identification via subdomain (e.g., `demo.bizpos.com`)

### Implementation
```
┌─────────────────────────────────────────────────────────┐
│                    Client Request                        │
│              Header: x-tenant-subdomain: demo            │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  Tenant Middleware                       │
│   - Validates tenant subdomain                          │
│   - Loads tenant context                                │
│   - Injects tenant_id into all queries                  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                    │
│        All queries filtered by tenant_id                │
└─────────────────────────────────────────────────────────┘
```

### Security Features
- All API calls require `x-tenant-subdomain` header
- Database-level tenant isolation in all 27+ tables
- Tenant-scoped queries enforced at service layer
- Cross-tenant data access prevented

---

## 2. Authentication System

### PIN-Based Authentication (POS Terminals)
- 4-6 digit numeric PINs for quick staff login
- Employee ID + PIN combination
- Ideal for fast-paced retail environments
- Failed login attempt tracking with auto-lock after 5 attempts

### Email/Password Authentication (Web Dashboard)
- Email and password login for managers/owners
- Bcrypt password hashing (10 rounds)
- Account lock/unlock functionality

### JWT Token Management
- JSON Web Tokens with 8-hour expiration
- Automatic token injection via Axios interceptors
- Auto-logout on 401 responses
- Token storage in localStorage with persistence

### Authentication Flow
```
User Login → Backend Validates → JWT Token Issued
                                       ↓
                              Stored in localStorage
                                       ↓
                    All API requests include Authorization header
                                       ↓
                    401 Response → Auto-logout → Redirect to login
```

### Session Management
- Persistent sessions across page refreshes
- Invalid/expired tokens trigger automatic logout
- Clean state on logout (all auth data removed)

---

## 3. Role-Based Access Control (RBAC)

### Default Roles
| Role | Access Level | Description |
|------|-------------|-------------|
| **Owner** | Full | Complete system access, all admin features |
| **Manager** | High | Admin portal, reports, staff management |
| **Cashier** | Standard | POS terminal, take orders, process payments |
| **Kitchen** | Limited | Kitchen display, order preparation |

### Permission System
- Flexible JSON-based permissions per role
- Location-based access control
- Role-based guards protecting all endpoints
- Frontend route protection based on user role

### Route Protection
- **ProtectedRoute** component guards authenticated routes
- Role verification at component level
- Automatic redirect for unauthorized access
- Loading states during authentication check

---

## 4. Admin Portal

**URL:** `http://localhost:5174`  
**Access:** Owner and Manager roles

### Dashboard
- Personalized welcome with user name
- Dynamic stat cards (Products, Categories, Locations, Orders)
- Location summary with order counts
- Recent activity feed
- Quick action buttons

### Categories Management
- Hierarchical category tree (unlimited nesting)
- Parent/child category relationships
- Color customization with visual indicators
- Drag-drop sort order support
- Active/inactive status toggle
- CRUD operations via modal forms

### Products Management
- Product grid display with image previews
- Advanced filtering (search, category filter)
- Product variants support
- Location-specific pricing
- Stock tracking with color-coded levels
- Image URL support with live preview
- CSV import ready

### Modifiers System
- **Modifier Groups:** Single/Multiple selection types
- **Selection Rules:** Min/Max selections, required/optional
- **Price Adjustments:** Add, replace, or multiply pricing
- Visual price indicators (green/red/gray)
- Product-modifier mapping with overrides

### Combo Builder
- Visual combo creation interface
- Multiple product selection with quantities
- Automatic savings calculation
- Combo pricing with discount display

### Availability Management
- Time-based scheduling (day of week, hours)
- Date range scheduling
- Holiday scheduling
- Apply to products, categories, or combos

### Location Management
- Multi-location support per tenant
- Location-specific pricing overrides
- Entity-location associations

---

## 5. POS Terminal

**URL:** `http://localhost:5173`  
**Access:** All authenticated users

### Interface
- Dark theme design (#0f172a, #1e293b)
- Responsive grid layout
- Touch-friendly for tablet use

### Category Navigation
- Horizontal scrolling tabs
- Active state highlighting
- Quick category switching

### Product Grid
- Auto-fill responsive grid (180px min)
- Product cards with images/placeholders
- Price display
- Hover effects with visual feedback

### Cart Sidebar (380px)
- Current order display
- Cart items with modifier badges
- Quantity controls (+/-)
- Price calculations

### Order Processing
- Real-time subtotal calculation
- Tax computation
- Discount application
- Payment processing (multiple methods)

---

## 6. Owner Portal

**URL:** `http://localhost:5175`  
**Access:** SaaS Platform Owners only

### Tenant Management
- Create new tenants
- Suspend/activate tenants
- Manage tenant subscriptions

### Platform Analytics
- Cross-tenant metrics
- Revenue reporting
- Usage statistics

### Feature Management
- Feature flags
- Platform settings
- Billing configuration

---

## 7. Menu Management System

### Categories API
- Full CRUD operations
- Hierarchical tree fetching
- Bulk sort ordering
- Include/exclude inactive items

### Products API
- CRUD with variants support
- Location-specific pricing
- Time-based availability
- Stock management
- Modifier assignment

### Modifiers API
- Modifier group management
- Individual modifier CRUD
- Product-modifier mapping
- Selection rules enforcement

### Combos API
- Combo product creation
- Item group management
- Auto-expansion for checkout
- Savings calculation

### Optimized POS Menu Loader
- **Single-query menu load** (1-2 queries for entire menu)
- Loads categories + products + modifiers + combos
- Location pricing applied automatically
- Time-based availability filtering
- Cache-friendly JSON structure
- Version hash for cache invalidation

---

## 8. Location Management

### Location-Entity Associations
Junction tables for flexible entity-location mapping:
- `category_locations` - Categories per location
- `product_locations` - Products per location
- `modifier_group_locations` - Modifier groups per location
- `modifier_locations` - Modifiers with price overrides
- `combo_locations` - Combos per location

### Features
- Copy entity to all locations option
- Selective location assignment
- Location-specific pricing overrides
- Location-based menu filtering

### Frontend Integration
- LocationSelector component in all forms
- "Copy to all locations" toggle
- Multi-select location picker
- Consistent implementation across pages

---

## 9. Desktop Application

### Technology
- **Electron** framework for cross-platform desktop support
- Wraps the POS Terminal web application
- Secure WebPreferences configuration

### Features
- Window configuration (1400x900)
- BIZPOS branding
- Development mode with DevTools
- Production build support
- Auto-reload on file changes
- Offline capability ready

### Security
- Context isolation enabled
- Node integration disabled (secure)
- Web security enforced

---

## 10. API Architecture

### Technology Stack
| Component | Technology |
|-----------|------------|
| Framework | NestJS 11.0.1 |
| Language | TypeScript 5.7.3 |
| ORM | Prisma 6.19.2 |
| Database | PostgreSQL 14+ |
| Auth | Passport.js + JWT |
| Validation | class-validator |

### API Endpoints Summary

#### Authentication
```
POST /api/auth/pin-login      - PIN login for POS
POST /api/auth/login          - Email/password login
POST /api/auth/refresh        - Token refresh
```

#### Categories
```
GET    /api/categories        - List all categories
GET    /api/categories/tree   - Get category tree
POST   /api/categories        - Create category
PUT    /api/categories/:id    - Update category
DELETE /api/categories/:id    - Delete category
POST   /api/categories/bulk-sort - Reorder categories
```

#### Products
```
GET    /api/products          - List products (with filters)
POST   /api/products          - Create product
PUT    /api/products/:id      - Update product
DELETE /api/products/:id      - Delete product
POST   /api/products/:id/location-prices - Set location pricing
PUT    /api/products/:id/availability - Set availability
PUT    /api/products/:id/stock - Update stock
```

#### Modifiers
```
GET    /api/modifier-groups   - List modifier groups
POST   /api/modifier-groups   - Create modifier group
GET    /api/modifiers         - List modifiers
POST   /api/modifiers         - Create modifier
POST   /api/product-modifiers - Map product to modifier group
```

#### Combos
```
GET    /api/combos            - List combo products
POST   /api/combos            - Create combo
PUT    /api/combos/:id        - Update combo
DELETE /api/combos/:id        - Delete combo
POST   /api/combos/:id/expand - Expand combo for checkout
```

#### Menu (POS Loader)
```
GET    /api/menu/pos          - Optimized POS menu load
GET    /api/menu/products     - Product list for POS
GET    /api/menu/check-updates - Check for menu updates
```

### Request Headers
All authenticated requests require:
```
Authorization: Bearer <jwt-token>
x-tenant-subdomain: <tenant-subdomain>
Content-Type: application/json
```

---

## Database Schema

### Core Tables (27+ tables)

#### Core
- `tenants` - Multi-tenant organization data
- `locations` - Physical store locations
- `users` - Staff members with authentication

#### Product Management
- `categories` - Hierarchical product categories
- `products` - Product catalog
- `product_location_prices` - Location-specific pricing
- `modifier_groups` - Customization groups
- `modifiers` - Individual options
- `product_modifier_groups` - Links products to modifiers
- `combo_products` - Bundle products
- `combo_items` - Items within combos

#### Orders & Transactions
- `orders` - Customer orders
- `order_items` - Line items
- `order_item_modifiers` - Customizations
- `payments` - Payment transactions
- `refunds` - Refund transactions

#### Additional
- `discounts` - Promotional discounts
- `loyalty_rewards` - Reward program rules
- `customers` - Customer database
- `customer_addresses` - Delivery addresses
- `inventory_items` - Raw materials
- `inventory_transactions` - Stock movements
- `recipes` - Product ingredients
- `tables` - Restaurant tables
- `table_sessions` - Active dining sessions

### Database Features
- Comprehensive indexes for performance
- Foreign keys with CASCADE deletes
- Soft deletes (deleted_at timestamps)
- Audit logging support
- UUID primary keys

---

## Security Features Summary

| Feature | Implementation |
|---------|---------------|
| Password Hashing | Bcrypt (10 rounds) |
| Token Authentication | JWT (8-hour expiry) |
| Tenant Isolation | Middleware + Service layer |
| Input Validation | class-validator DTOs |
| CORS | Configured for frontend origins |
| Role Guards | NestJS Guards |
| Auto-logout | 401 response handling |
| Account Locking | After 5 failed attempts |

---

## Technology Stack Summary

### Backend
- Node.js 24.x
- NestJS 11.x
- TypeScript 5.x
- Prisma 6.x
- PostgreSQL 14+
- Passport.js + JWT

### Frontend
- React 19.x
- TypeScript 5.x
- Vite 7.x
- Tailwind CSS
- React Router 7.x
- Axios

### Desktop
- Electron 40.x

### Development
- pnpm (monorepo)
- Turborepo
- ESLint
- Prettier
