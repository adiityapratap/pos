# BIZPOS - Complete Technical Documentation

> **Version:** 1.0.0  
> **Last Updated:** February 18, 2026  
> **Architecture:** Cloud-Native Multi-Tenant SaaS with Offline-First Desktop Support

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Core Features](#4-core-features)
5. [Offline-First Architecture](#5-offline-first-architecture)
6. [Real-Time Communication System](#6-real-time-communication-system)
7. [Database Design](#7-database-design)
8. [Authentication & Security](#8-authentication--security)
9. [API Architecture](#9-api-architecture)
10. [Desktop Application](#10-desktop-application)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Design Decisions & Rationale](#12-design-decisions--rationale)

---

## 1. Executive Summary

**BIZPOS** is a production-ready, multi-tenant Point of Sale (POS) SaaS platform designed for restaurants, cafes, and retail businesses. The system provides:

- **Cloud-Native Architecture** - Full SaaS capabilities with multi-tenancy
- **Offline-First Desktop App** - Continues working without internet
- **Real-Time Synchronization** - WebSocket-based live updates across terminals
- **Guaranteed Message Delivery** - Event queue with ACKs and replay
- **Multi-Location Support** - Manage multiple stores from one account

### Key Differentiators

| Feature | Traditional POS | BIZPOS |
|---------|----------------|--------|
| Internet Dependency | Required always | Optional (offline-first) |
| Data Loss Risk | High on connection drop | Zero (event queue + replay) |
| Multi-Location | Separate systems | Unified management |
| Real-Time Sync | Manual refresh | Automatic WebSocket |
| Deployment | On-premise only | Cloud + Desktop hybrid |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLOUD LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Admin Portal   │  │  Owner Portal   │  │  NestJS Backend │     │
│  │  (React/Vite)   │  │  (React/Vite)   │  │  + WebSocket    │     │
│  │   Port: 5174    │  │   Port: 5175    │  │   Port: 3000    │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
│           └────────────────────┼────────────────────┘               │
│                                │                                    │
│                       ┌────────▼────────┐                          │
│                       │   PostgreSQL    │                          │
│                       │   (Multi-Tenant)│                          │
│                       └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    │     Internet/VPN      │
                    └───────────┬───────────┘
                                │
┌─────────────────────────────────────────────────────────────────────┐
│                         LOCAL LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    ELECTRON DESKTOP APP                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │   │
│  │  │  POS Terminal   │  │  Local Express  │  │   SQLite    │  │   │
│  │  │  (React/Vite)   │  │  + Socket.IO    │  │  Database   │  │   │
│  │  │   Port: 5173    │  │   Port: 3001    │  │  (Offline)  │  │   │
│  │  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘  │   │
│  │           └────────────────────┼──────────────────┘         │   │
│  │                                │                            │   │
│  │            ┌───────────────────┼───────────────────┐        │   │
│  │            │  UDP Discovery │ Cloud Sync Service  │        │   │
│  │            └───────────────────────────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              LAN NETWORK (Multiple Terminals)                │  │
│  │   [Terminal 1] ◄──► [Terminal 2] ◄──► [Terminal 3]          │  │
│  │        ▲                  ▲                  ▲               │  │
│  │        └──────────────────┼──────────────────┘               │  │
│  │                    UDP Broadcast                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Monorepo Structure

```
pos-saas/
├── apps/
│   ├── backend/           # NestJS API (Cloud)
│   ├── admin-portal/      # Tenant Admin Dashboard
│   ├── pos-terminal/      # POS Interface
│   ├── owner-portal/      # SaaS Owner Dashboard
│   └── desktop/           # Electron Wrapper
│       └── local-server/  # Embedded Express API
│
├── packages/
│   ├── types/             # Shared TypeScript types
│   ├── ui/                # Shared React components
│   └── api-client/        # Shared API utilities
│
└── Configuration files (turbo.json, pnpm-workspace.yaml, etc.)
```

---

## 3. Technology Stack

### 3.1 Backend Technologies

| Technology | Version | Purpose | Why Chosen |
|------------|---------|---------|------------|
| **NestJS** | 11.0.1 | API Framework | Enterprise-grade, modular, TypeScript-first, excellent WebSocket support |
| **TypeScript** | 5.9.x | Language | Type safety, better DX, catch errors at compile time |
| **Prisma** | 6.19.2 | ORM | Type-safe queries, auto-generated types, excellent migrations |
| **PostgreSQL** | 14+ | Database | ACID compliance, JSON support, multi-tenant friendly |
| **Socket.IO** | 4.7.4 | WebSockets | Reliable real-time, fallback to polling, room support |
| **Passport** | 0.7.0 | Authentication | Flexible strategies, JWT support, battle-tested |
| **bcrypt** | 6.0.0 | Password Hashing | Industry standard, configurable work factor |

**Why NestJS over Express?**
- Built-in dependency injection for testability
- Decorators for cleaner WebSocket handling
- Modular architecture scales better
- Native TypeScript support
- Standardized project structure

### 3.2 Frontend Technologies

| Technology | Version | Purpose | Why Chosen |
|------------|---------|---------|------------|
| **React** | 19.2.0 | UI Framework | Component-based, large ecosystem, React 19's new features |
| **Vite** | 7.2.4 | Build Tool | Fastest HMR, native ESM, excellent React support |
| **TypeScript** | 5.9.x | Language | Type safety, better refactoring, IDE support |
| **Tailwind CSS** | 3.4.19 | Styling | Utility-first, consistent design, small bundle |
| **React Router** | 7.13.0 | Routing | v7's data loading, nested routes, type safety |
| **Axios** | 1.13.4 | HTTP Client | Interceptors, request/response transforms |
| **Socket.IO Client** | 4.7.4 | WebSocket Client | Matches server, auto-reconnect, event-based |

**Why Vite over Create React App?**
- 10-100x faster HMR
- Native ESM = smaller bundles
- Better tree-shaking
- First-class TypeScript support

### 3.3 Desktop Technologies

| Technology | Version | Purpose | Why Chosen |
|------------|---------|---------|------------|
| **Electron** | 40.4.1 | Desktop Framework | Cross-platform, web tech, native APIs |
| **better-sqlite3** | 12.6.2 | Local Database | Synchronous API, fast, single file |
| **Express** | 4.21.x | Local API | Same patterns as cloud, easy sync |
| **bcryptjs** | 2.4.3 | Password Hashing | Pure JS for Electron compatibility |
| **electron-builder** | 26.x | Packaging | NSIS installer, auto-updates, cross-platform |

**Why SQLite over IndexedDB?**
- Full SQL support for complex queries
- Better for relational data (orders, products, modifiers)
- Familiar to backend devs
- Easy backup/restore (single file)

### 3.4 Monorepo Tools

| Tool | Version | Purpose | Why Chosen |
|------|---------|---------|------------|
| **pnpm** | 10.28.0 | Package Manager | Fast, disk efficient, strict dependency resolution |
| **Turborepo** | 2.5.4 | Build Orchestration | Caching, parallel builds, incremental compilation |

**Why pnpm over npm/yarn?**
- 3x faster than npm
- Hard links = saves disk space
- Strict mode prevents ghost dependencies
- Native workspace support

---

## 4. Core Features

### 4.1 Multi-Tenant Architecture

**Strategy:** Single Database, Shared Schema with Tenant ID

```
┌─────────────────────────────────────────────────────────┐
│                 Every Table Has tenant_id               │
├─────────────────────────────────────────────────────────┤
│  products    │ tenant_id │ name        │ price │ ...   │
│  orders      │ tenant_id │ order_num   │ total │ ...   │
│  categories  │ tenant_id │ name        │ color │ ...   │
└─────────────────────────────────────────────────────────┘
```

**Why This Strategy?**

| Strategy | Pros | Cons | Our Choice |
|----------|------|------|------------|
| Separate Databases | Complete isolation | Expensive, complex migrations | ❌ |
| Separate Schemas | Good isolation | PostgreSQL-only, complex | ❌ |
| **Shared + tenant_id** | Simple, scalable, cost-effective | Requires careful queries | ✅ |

**Implementation:**
- Tenant middleware validates `x-tenant-subdomain` header
- All service methods include tenant filtering
- Database indexes on `tenant_id` for performance
- 27+ tables with complete tenant isolation

### 4.2 Authentication System

**Dual Authentication Modes:**

```
┌─────────────────────────────────────────────────────────┐
│  POS Terminal (Fast Access)      │  Admin Portal       │
├──────────────────────────────────┼─────────────────────┤
│  PIN-Based Login                 │  Email/Password     │
│  • 4-6 digit PIN                 │  • Bcrypt (10 rounds)│
│  • Employee ID + PIN             │  • 8-hour JWT       │
│  • Quick staff switching         │  • Auto-logout      │
│  • 5 failed attempts = lock      │  • Persistent sessions│
└──────────────────────────────────┴─────────────────────┘
```

**JWT Token Flow:**
```
Login → Backend Validates → JWT Issued (8hr expiry)
                                    ↓
                          localStorage Storage
                                    ↓
                   Axios Interceptor adds Authorization header
                                    ↓
                   401 Response → Auto-logout → Redirect
```

### 4.3 Role-Based Access Control (RBAC)

| Role | Access Level | Capabilities |
|------|-------------|--------------|
| **Owner** | Full | All features, tenant management, reports |
| **Manager** | High | Admin portal, staff management, void orders |
| **Cashier** | Standard | POS terminal, take orders, process payments |
| **Kitchen** | Limited | Kitchen display, order status updates |

**Implementation:**
- JSON-based flexible permissions per role
- Location-based access control
- Route guards on both frontend and backend
- `ProtectedRoute` component for React

### 4.4 Menu Management

**Hierarchical Category System:**
```
Categories (Parent/Child)
    └── Subcategories
        └── Products
            └── Modifiers
                └── Modifier Options
```

**Modifier System:**
- **Modifier Groups:** Single/Multiple selection types
- **Selection Rules:** Min/Max, required/optional
- **Price Adjustments:** Add, replace, or multiply
- Product-modifier mapping with location overrides

### 4.5 Multi-Location Support

Each entity can be associated with specific locations:
- Location-specific pricing overrides
- Per-location product availability
- Location-scoped orders and reports
- Staff assigned to locations

---

## 5. Offline-First Architecture

### 5.1 Why Offline-First?

| Scenario | Traditional POS | BIZPOS Offline-First |
|----------|----------------|---------------------|
| Internet outage | **System down** | Continues working |
| Slow connection | Timeouts, errors | Local-first, sync later |
| Peak hours | Server overload | Local processing |
| Data loss risk | High | Zero (local + cloud) |

### 5.2 Local Server Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   ELECTRON APP                           │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │              Local Express Server               │   │
│  │                  (Port 3001)                    │   │
│  │                                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────┐  │   │
│  │  │  REST API   │  │  Socket.IO  │  │ SQLite │  │   │
│  │  │ /api/auth   │  │  /pos       │  │   DB   │  │   │
│  │  │ /api/orders │  │ namespace   │  │        │  │   │
│  │  │ /api/menu   │  │             │  │        │  │   │
│  │  └─────────────┘  └─────────────┘  └────────┘  │   │
│  │                         │                       │   │
│  │  ┌──────────────────────┼──────────────────┐   │   │
│  │  │         Event Queue Service             │   │   │
│  │  │  • Queue events before sending          │   │   │
│  │  │  • Track ACKs from clients              │   │   │
│  │  │  • Retry with exponential backoff       │   │   │
│  │  │  • Replay missed events on reconnect    │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
│                           │                            │
│  ┌────────────────────────┼────────────────────────┐  │
│  │              Cloud Sync Service                 │  │
│  │  • Check online status (30s interval)          │  │
│  │  • Upload orders when online                   │  │
│  │  • Download menu updates (HTTP polling)        │  │
│  │  • Conflict resolution                         │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Data Flow: Offline → Online

```
1. CREATE ORDER (Offline)
   └── Save to SQLite with sync_status='pending'
   
2. CHECK ONLINE STATUS (Every 30s)
   └── HTTP GET /health to cloud server
   
3. SYNC ORDERS (When Online)
   └── Upload pending orders to cloud
   └── Update sync_status='synced'
   
4. CONFLICT RESOLUTION
   └── Cloud is source of truth for menu
   └── Local is source of truth for orders (until synced)
```

### 5.4 UDP Server Discovery

**Why UDP Broadcast?**
- No manual IP configuration
- Automatic server detection on LAN
- Terminals find server without user input

```javascript
// Server broadcasts presence every 3 seconds
{
  type: 'BIZPOS_SERVER_ANNOUNCE',
  id: 'server-1708300800000',
  name: 'BIZPOS Server',
  port: 3001,
  ips: ['192.168.1.100'],
  startedAt: '2026-02-18T10:00:00.000Z'
}

// Clients listen on UDP port 41234
// Auto-connect to discovered server
```

---

## 6. Real-Time Communication System

### 6.1 Why Socket.IO over Raw WebSockets?

| Feature | Raw WebSocket | Socket.IO |
|---------|--------------|-----------|
| Auto-reconnect | Manual | Built-in |
| Fallback to polling | No | Yes |
| Room/namespace support | Manual | Built-in |
| Event-based API | No | Yes |
| Binary support | Basic | Enhanced |
| Client library | DIY | Provided |

### 6.2 WebSocket Architecture

```
┌─────────────────────────────────────────────────────────┐
│              SOCKET.IO SERVER (/pos namespace)          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                    ROOMS                        │   │
│  │  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │ location:xxx │  │   role:pos   │            │   │
│  │  │ (per store)  │  │ (all POS)    │            │   │
│  │  └──────────────┘  └──────────────┘            │   │
│  │  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │  role:admin  │  │  role:owner  │            │   │
│  │  │ (managers)   │  │ (owners)     │            │   │
│  │  └──────────────┘  └──────────────┘            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Events:                                               │
│  • terminal:register  - Join rooms on connect         │
│  • order:created/updated/completed                    │
│  • menu:updated/refresh                               │
│  • sync:status                                        │
│  • event:ack         - Acknowledge receipt            │
│  • events:replay     - Request missed events          │
└─────────────────────────────────────────────────────────┘
```

### 6.3 Guaranteed Message Delivery System

**The 4-Component System:**

```
┌─────────────────────────────────────────────────────────┐
│        GUARANTEED MESSAGE DELIVERY FLOW                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. EVENT QUEUE                                        │
│     └── Event created with unique ID                   │
│     └── Stored in memory queue (24hr retention)        │
│     └── Max 10,000 events in queue                     │
│                                                         │
│  2. MESSAGE ACKs                                       │
│     └── Events wrapped with eventId, timestamp         │
│     └── Clients send 'event:ack' after processing     │
│     └── Server tracks ACKs per terminal               │
│     └── Deduplication prevents double-processing       │
│                                                         │
│  3. RECONNECT LOGIC                                    │
│     └── Auto-reconnect with exponential backoff       │
│     └── Delays: 1s, 2s, 4s, 8s, 16s... max 30s        │
│     └── Max 10 reconnection attempts                  │
│     └── Re-register terminal on reconnect             │
│                                                         │
│  4. MISSED EVENT REPLAY                                │
│     └── Client tracks lastReceivedEventId             │
│     └── On reconnect: emit 'events:replay'            │
│     └── Server replays all unACKed events             │
│     └── Client deduplicates to prevent doubles        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Flow Diagram:**

```
Order Created
      │
      ▼
┌─────────────────┐
│ Add to QUEUE    │ ← Event ID: evt_1708300800_abc123
│ (with unique ID)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Send via Socket │ ← Wrapped: {eventId, payload, requiresAck: true}
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────────────────┐
│ Terminal        │ ──► │ Process event                │
│ Receives Event  │     │ Send ACK: {eventId}          │
└────────┬────────┘     │ Track as lastReceivedEventId │
         │              └──────────────────────────────┘
         ▼
    [ACK Received?]
         │
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    ▼         ▼
┌────────┐  ┌────────────────────────────┐
│ Mark   │  │ RETRY with exponential     │
│ Delivered│ │ backoff (1s, 2s, 4s...)    │
└────────┘  └────────────────────────────┘
                        │
                        ▼
                ┌──────────────┐
                │ Max retries? │
                │ (5 attempts) │
                └──────┬───────┘
                       │
                   YES │
                       ▼
                ┌──────────────┐
                │ Mark FAILED  │
                │ (logged)     │
                └──────────────┘


ON RECONNECT:
┌─────────────────┐
│ Client connects │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Emit 'events:replay'        │
│ {lastEventId, lastTimestamp}│
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Server finds all unACKed    │
│ events since lastEventId    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Replay events to client     │
│ (client deduplicates)       │
└─────────────────────────────┘
```

### 6.4 Event Types

| Event | Direction | Purpose |
|-------|-----------|---------|
| `terminal:register` | Client → Server | Join location/role rooms |
| `terminal:connected` | Server → Clients | Notify others of new terminal |
| `terminal:disconnected` | Server → Clients | Notify others of disconnect |
| `order:created` | Client ↔ Server | New order notification |
| `order:updated` | Client ↔ Server | Order status change |
| `order:completed` | Client ↔ Server | Order finished |
| `menu:updated` | Server → Clients | Menu item changed |
| `menu:refresh` | Server → Clients | Request full menu reload |
| `sync:status` | Client → Server | Sync progress update |
| `event:ack` | Client → Server | Acknowledge event receipt |
| `events:replay` | Client → Server | Request missed events |

---

## 7. Database Design

### 7.1 Schema Overview

**27+ Tables organized into sections:**

```
┌─────────────────────────────────────────────────────────┐
│           CORE TENANT & MULTI-LOCATION                  │
├─────────────────────────────────────────────────────────┤
│  tenants          │ Core tenant info, subscription     │
│  locations        │ Physical store locations           │
│  users            │ Staff accounts                     │
│  roles            │ Role definitions                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│               MENU & PRODUCTS                           │
├─────────────────────────────────────────────────────────┤
│  categories       │ Hierarchical menu categories       │
│  products         │ Menu items                         │
│  modifier_groups  │ Modifier group definitions         │
│  modifiers        │ Individual modifier options        │
│  combos           │ Combo meal definitions             │
│  combo_items      │ Products in combos                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   ORDERS                                │
├─────────────────────────────────────────────────────────┤
│  orders           │ Order headers                      │
│  order_items      │ Line items                         │
│  order_item_modifiers │ Applied modifiers              │
│  payments         │ Payment records                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│             INVENTORY & RECIPES                         │
├─────────────────────────────────────────────────────────┤
│  inventory_items  │ Stock items                        │
│  recipes          │ Product recipes                    │
│  inventory_adjustments │ Stock movements               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│          PROMOTIONS & LOYALTY                           │
├─────────────────────────────────────────────────────────┤
│  promotions       │ Discount rules                     │
│  vouchers         │ Gift cards, vouchers               │
│  loyalty_rules    │ Points earning rules               │
│  customers        │ Customer profiles                  │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Key Design Decisions

**1. Soft Deletes (`deleted_at`):**
- All entities use `deleted_at` instead of hard delete
- Preserves data integrity and audit trail
- Easy recovery of accidentally deleted items

**2. Timestamp Columns:**
- `created_at`: Record creation time
- `updated_at`: Auto-updated on changes (Prisma @updatedAt)
- `deleted_at`: Soft delete timestamp

**3. Location Association Tables:**
- `category_locations`: Categories per location
- `product_locations`: Products per location
- `product_location_prices`: Location-specific pricing

**4. Indexing Strategy:**
```sql
-- Always index tenant_id for multi-tenant queries
@@index([tenantId], name: "idx_products_tenant")

-- Composite indexes for common filters
@@index([tenantId, categoryId], name: "idx_products_tenant_category")

-- Unique constraints with tenant scoping
@@unique([tenantId, name], name: "categories_tenant_name_unique")
```

### 7.3 Local SQLite Schema

The desktop app uses a mirrored schema in SQLite:

```sql
-- Same structure, adapted for SQLite
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  pin_code TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'cashier',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

-- Sync tracking
CREATE TABLE orders (
  ...
  sync_status TEXT DEFAULT 'pending',  -- 'pending', 'synced', 'failed'
  synced_at TEXT,
  cloud_id TEXT  -- ID in cloud database after sync
);
```

---

## 8. Authentication & Security

### 8.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                 AUTHENTICATION FLOW                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  POS Terminal (PIN Login):                             │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐   │
│  │ Enter PIN  │ ─► │ Validate   │ ─► │ Issue JWT  │   │
│  │            │    │ bcrypt     │    │ (8 hours)  │   │
│  └────────────┘    └────────────┘    └────────────┘   │
│                                                         │
│  Admin Portal (Email/Password):                        │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐   │
│  │ Email +    │ ─► │ Validate   │ ─► │ Issue JWT  │   │
│  │ Password   │    │ bcrypt     │    │ (8 hours)  │   │
│  └────────────┘    └────────────┘    └────────────┘   │
│                                                         │
│  API Request:                                          │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐   │
│  │ Include    │ ─► │ Validate   │ ─► │ Process    │   │
│  │ JWT Bearer │    │ Signature  │    │ Request    │   │
│  │ + Tenant   │    │ + Tenant   │    │            │   │
│  └────────────┘    └────────────┘    └────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Security Measures

| Layer | Security Measure | Implementation |
|-------|-----------------|----------------|
| **Password** | Bcrypt hashing | 10 rounds (configurable) |
| **Token** | JWT with expiration | 8-hour expiry |
| **Tenant** | Header validation | `x-tenant-subdomain` required |
| **API** | Guards on routes | `@UseGuards(JwtAuthGuard)` |
| **Frontend** | Protected routes | `ProtectedRoute` component |
| **Account** | Brute force protection | Lock after 5 failed attempts |

### 8.3 CORS Configuration

```typescript
// Backend CORS (development)
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
});

// Socket.IO CORS
@WebSocketGateway({
  cors: {
    origin: '*',  // Configured for LAN access
    credentials: true,
  },
})
```

---

## 9. API Architecture

### 9.1 REST API Endpoints

```
┌─────────────────────────────────────────────────────────┐
│                    REST API (NestJS)                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  AUTH                                                  │
│  POST /api/auth/login          Email/password login    │
│  POST /api/auth/pin-login      PIN-based login         │
│  GET  /api/auth/me             Current user info       │
│                                                         │
│  CATEGORIES                                            │
│  GET    /api/categories        List all                │
│  GET    /api/categories/:id    Get by ID               │
│  POST   /api/categories        Create                  │
│  PUT    /api/categories/:id    Update                  │
│  DELETE /api/categories/:id    Soft delete             │
│                                                         │
│  PRODUCTS                                              │
│  GET    /api/products          List with filters       │
│  GET    /api/products/:id      Get by ID               │
│  POST   /api/products          Create                  │
│  PUT    /api/products/:id      Update                  │
│  DELETE /api/products/:id      Soft delete             │
│                                                         │
│  MODIFIERS                                             │
│  GET    /api/modifier-groups   List modifier groups    │
│  GET    /api/modifiers         List modifiers          │
│  POST   /api/modifiers         Create modifier         │
│                                                         │
│  ORDERS                                                │
│  GET    /api/orders            List orders             │
│  GET    /api/orders/:id        Get order details       │
│  POST   /api/orders            Create order            │
│  PUT    /api/orders/:id/status Update status           │
│  PUT    /api/orders/:id/payment Update payment         │
│                                                         │
│  LOCATIONS                                             │
│  GET    /api/locations         List locations          │
│  POST   /api/locations         Create location         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Request/Response Format

**Request Headers:**
```
Authorization: Bearer <jwt_token>
x-tenant-subdomain: demo
Content-Type: application/json
```

**Response Format:**
```json
// Success
{
  "id": "uuid",
  "name": "Product Name",
  "price": 9.99,
  "createdAt": "2026-02-18T10:00:00.000Z"
}

// Error
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 9.3 Local Server API (Desktop)

The local server mirrors the cloud API for offline use:

```
┌─────────────────────────────────────────────────────────┐
│              LOCAL EXPRESS API (Port 3001)              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Same endpoints as cloud, with additions:              │
│                                                         │
│  GET  /api/server/status       Server health           │
│  GET  /api/server/ips          Local IP addresses      │
│  GET  /api/sync/status         Sync status             │
│  POST /api/sync/trigger        Manual sync trigger     │
│                                                         │
│  Data stored in SQLite instead of PostgreSQL          │
│  Automatic sync to cloud when online                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Desktop Application

### 10.1 Electron Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   ELECTRON MAIN PROCESS                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  main.js                                               │
│  ├── BrowserWindow creation (1400x900)                 │
│  ├── Local server startup                              │
│  ├── Config management (APPDATA/BIZPOS)               │
│  └── IPC handlers                                      │
│                                                         │
│  IPC Handlers:                                         │
│  • get-server-url    → Returns local server URL       │
│  • get-config        → Returns stored configuration   │
│  • set-config        → Saves configuration            │
│  • discover-servers  → Start UDP discovery            │
│  • get-discovered-servers → List found servers        │
│  • trigger-sync      → Manual cloud sync              │
│  • get-sync-status   → Sync status                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │        preload.js         │
              │   (Context Bridge API)    │
              └─────────────┬─────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                   RENDERER PROCESS                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  POS Terminal React App                                │
│  • Loads from Vite dev server (dev) or bundled (prod) │
│  • Accesses Electron API via window.electronAPI       │
│  • Connects to local server for data                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 10.2 Build Configuration

```javascript
// electron-builder config
{
  appId: 'com.bizpos.desktop',
  productName: 'BIZPOS',
  win: {
    target: [
      { target: 'nsis', arch: ['x64'] },      // Installer
      { target: 'portable', arch: ['x64'] }   // Portable
    ]
  },
  nsis: {
    oneClick: false,
    perMachine: true,
    allowToChangeInstallationDirectory: true
  }
}
```

### 10.3 File System Structure

```
%APPDATA%/BIZPOS/
├── config.json          # Server mode, URLs, location ID
├── bizpos.db            # SQLite database
└── logs/                # Application logs
```

---

## 11. Deployment Architecture

### 11.1 Cloud Deployment (Railway)

```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run start:prod"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[services]]
name = "backend"
source = "apps/backend"
```

### 11.2 Frontend Deployment (Vercel)

```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 11.3 Desktop Distribution

| Format | Use Case | Size |
|--------|----------|------|
| **NSIS Installer** | Standard installation | ~100MB |
| **Portable** | USB/No install needed | ~100MB |

---

## 12. Design Decisions & Rationale

### 12.1 Why Offline-First?

**Problem:** Restaurant POS systems cannot afford downtime during service hours. Internet outages, slow connections, or server issues can halt operations.

**Solution:** Local-first architecture with background sync.

**Benefits:**
- Zero downtime during internet issues
- Faster response times (local processing)
- No data loss (local storage + sync)
- Works in areas with unreliable internet

### 12.2 Why Event Queue with ACKs?

**Problem:** WebSocket messages can be lost if:
- Client disconnects mid-transmission
- Network hiccup occurs
- Client crashes before processing

**Solution:** 4-component guaranteed delivery system.

```
Without ACK System:          With ACK System:
─────────────────           ─────────────────
Order sent ─► Lost          Order sent ─► Queued
             ✗                           ─► Sent
                                          ─► ACK received ✓
OR                                        OR
Order sent ─► Lost          Order sent ─► Queued
             ✗                           ─► Sent
                                          ─► No ACK
                                          ─► Retry (backoff)
                                          ─► ACK received ✓
```

### 12.3 Why Multi-Tenant with Shared Schema?

**Problem:** SaaS platform needs to support hundreds of businesses efficiently.

**Options Considered:**
1. **Separate databases per tenant** - Most isolation, but expensive and complex
2. **Separate schemas per tenant** - Good isolation, but PostgreSQL-specific
3. **Shared schema with tenant_id** - Simple, scalable, cost-effective

**Decision:** Option 3 with careful implementation:
- Every query includes tenant filter
- Indexes on tenant_id columns
- Middleware enforces tenant context
- No cross-tenant data access possible

### 12.4 Why Vite over Create React App?

**Performance Comparison:**

| Metric | Create React App | Vite |
|--------|-----------------|------|
| Dev server start | 10-30s | <1s |
| HMR (Hot reload) | 2-5s | <50ms |
| Build time | 60-120s | 10-30s |
| Bundle size | Larger | Smaller (better tree-shaking) |

**Decision:** Vite provides 10-100x faster development experience.

### 12.5 Why Socket.IO over Raw WebSockets?

**Comparison:**

| Feature | Raw WebSocket | Socket.IO |
|---------|--------------|-----------|
| Auto-reconnect | Manual implementation | ✓ Built-in |
| Fallback to polling | Manual implementation | ✓ Built-in |
| Rooms/namespaces | Manual implementation | ✓ Built-in |
| Event-based API | No | ✓ Yes |
| Acknowledgments | Manual implementation | ✓ Built-in |

**Decision:** Socket.IO provides production-ready features out of the box.

### 12.6 Why SQLite for Desktop?

**Options Considered:**
1. **IndexedDB** - Browser-based, async only, limited querying
2. **SQLite** - Full SQL, synchronous API, single file
3. **PouchDB** - Good sync, but complex for relational data

**Decision:** SQLite because:
- Same query patterns as PostgreSQL backend
- Easy backup (single file)
- Full SQL support for complex joins
- Better for relational data (orders with items and modifiers)

---

## Appendix A: Quick Reference

### Port Assignments

| Service | Port | Environment |
|---------|------|-------------|
| POS Terminal | 5173 | Development |
| Admin Portal | 5174 | Development |
| Owner Portal | 5175 | Development |
| Cloud Backend | 3000 | Development/Production |
| Local Server | 3001 | Desktop |
| UDP Discovery | 41234 | Desktop LAN |

### Environment Variables

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secret-key
JWT_EXPIRATION=8h

# Frontend
VITE_API_URL=http://localhost:3000/api
```

### Test Credentials

| Role | Employee ID | PIN | Email |
|------|-------------|-----|-------|
| Owner | EMP-001 | 1234 | admin@demo.com |
| Manager | EMP-002 | 9999 | manager@demo.com |
| Cashier | EMP-003 | 5678 | cashier@demo.com |

---

## Appendix B: File Reference

### Key Files by Feature

| Feature | Key Files |
|---------|-----------|
| WebSocket Gateway | `apps/backend/src/websockets/pos.gateway.ts` |
| Event Queue | `apps/backend/src/websockets/event-queue.service.ts` |
| Socket Client | `apps/pos-terminal/src/services/socket.service.ts` |
| Socket Context | `apps/pos-terminal/src/context/SocketContext.tsx` |
| Local Server | `apps/desktop/local-server/index.js` |
| Local Event Queue | `apps/desktop/local-server/event-queue.js` |
| Local Socket | `apps/desktop/local-server/socket-server.js` |
| Cloud Sync | `apps/desktop/local-server/sync-service.js` |
| UDP Discovery | `apps/desktop/local-server/discovery.js` |
| Database Schema | `apps/backend/prisma/schema.prisma` |
| Local DB Init | `apps/desktop/local-server/init-db.js` |
| Electron Main | `apps/desktop/main.js` |
| Auth Service | `apps/backend/src/auth/` |

---

*Documentation generated for BIZPOS v1.0.0*  
*Last updated: February 18, 2026*
