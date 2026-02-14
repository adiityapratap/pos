# Multi-Tenant POS Database Schema - Prisma Migration Guide

## Overview
This is a production-ready, enterprise-grade Point of Sale (POS) database schema designed for 1000+ tenants using a single shared PostgreSQL database.

## Features
- ✅ Multi-tenant architecture with row-level security
- ✅ Complete menu management (categories, products, modifiers)
- ✅ Order processing & payment handling
- ✅ Inventory management with auto-deduction
- ✅ Loyalty & promotions system
- ✅ Kitchen Display System (KDS) support
- ✅ Audit logging
- ✅ Analytics & reporting
- ✅ Multi-location support

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Prisma CLI

## Installation Steps

### 1. Install Dependencies
```bash
cd backend
npm install
npm install -D prisma
npm install @prisma/client
```

### 2. Set Up Environment Variables
Create a `.env` file in the `backend` directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/pos_saas?schema=public"
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Create the Database
```bash
# Create database (if not exists)
createdb pos_saas

# Or using psql
psql -U postgres -c "CREATE DATABASE pos_saas;"
```

### 5. Run Prisma Migration
This will create all tables, indexes, and constraints:

```bash
npx prisma migrate dev --name init
```

### 6. Apply PostgreSQL-Specific Features
Run the post-deployment SQL to add extensions, triggers, functions, and RLS policies:

```bash
psql -U postgres -d pos_saas -f prisma/migrations/post-deploy.sql
```

Or using a Node.js script:

```bash
node -e "require('fs').readFileSync('prisma/migrations/post-deploy.sql', 'utf-8').split(';').forEach(q => { if(q.trim()) console.log(q); });"
```

## Database Schema Structure

### Core Tables (40+ tables)
1. **Tenants & Locations**
   - `tenants` - Main tenant isolation
   - `locations` - Stores/branches

2. **User Management**
   - `users` - Staff/employees

3. **Menu Structure**
   - `categories` - Product categories
   - `products` - Menu items
   - `modifier_groups` - Modifier groups (size, extras)
   - `modifiers` - Individual modifiers
   - `combo_items` - Combo/meal deals

4. **Orders & Transactions**
   - `orders` - Order headers
   - `order_items` - Order line items
   - `order_item_modifiers` - Selected modifiers
   - `payments` - Payment transactions

5. **Promotions & Loyalty**
   - `promotions` - Discounts & coupons
   - `vouchers` - Gift cards
   - `customers` - Customer/loyalty members
   - `loyalty_transactions` - Points tracking

6. **Inventory**
   - `inventory_items` - Stock items
   - `recipes` - Product ingredients
   - `inventory_adjustments` - Stock movements

7. **Reporting**
   - `daily_sales_summary` - Pre-aggregated sales data
   - `audit_logs` - Audit trail

## Usage Examples

### 1. Create a Tenant
```typescript
const tenant = await prisma.tenant.create({
  data: {
    businessName: "Joe's Coffee Shop",
    subdomain: "joes-coffee",
    countryCode: "US",
    planType: "professional",
    subscriptionStatus: "active"
  }
});
```

### 2. Create a Product with Modifiers
```typescript
const product = await prisma.product.create({
  data: {
    tenantId: tenant.id,
    name: "Latte",
    basePrice: 4.50,
    modifierGroups: {
      create: [
        {
          tenantId: tenant.id,
          modifierGroup: {
            create: {
              tenantId: tenant.id,
              name: "Size",
              selectionType: "single",
              isRequired: true,
              modifiers: {
                create: [
                  { tenantId: tenant.id, name: "Small", priceChange: 0.00 },
                  { tenantId: tenant.id, name: "Medium", priceChange: 1.00 },
                  { tenantId: tenant.id, name: "Large", priceChange: 2.00 }
                ]
              }
            }
          }
        }
      ]
    }
  }
});
```

### 3. Create an Order
```typescript
const order = await prisma.order.create({
  data: {
    tenantId: tenant.id,
    locationId: location.id,
    orderNumber: "0001",
    orderType: "dine_in",
    createdByUserId: user.id,
    orderItems: {
      create: [
        {
          tenantId: tenant.id,
          productId: product.id,
          itemName: "Latte",
          quantity: 1,
          unitPrice: 5.50,
          lineTotal: 5.50
        }
      ]
    },
    subtotal: 5.50,
    totalAmount: 5.50
  }
});
```

## Row-Level Security (RLS)

To use RLS in your application, set the tenant context before queries:

```typescript
// Set tenant context
await prisma.$executeRaw`SET app.current_tenant_id = ${tenantId}`;

// All queries will now be filtered by tenant_id automatically
const products = await prisma.product.findMany();
```

## Performance Optimization

### Indexes
The schema includes 100+ optimized indexes for:
- Tenant isolation
- Fast product lookup
- Order queries by date
- Customer search
- Full-text search

### Connection Pooling
Use PgBouncer for production:
```
DATABASE_URL="postgresql://username:password@localhost:6432/pos_saas?schema=public&pgbouncer=true"
```

### Recommended PostgreSQL Settings
See `post-deploy.sql` for detailed configuration recommendations.

## Migration Commands

```bash
# Generate migration
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (GUI)
npx prisma studio
```

## Prisma Studio
Explore your database with the built-in GUI:
```bash
npx prisma studio
```
Opens at http://localhost:5555

## Troubleshooting

### Issue: UUID generation not working
**Solution:** Run the post-deploy.sql to install uuid-ossp extension

### Issue: Triggers not firing
**Solution:** Ensure post-deploy.sql has been executed

### Issue: RLS blocking queries
**Solution:** Either disable RLS for development or set the tenant context:
```sql
ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;
```

## Next Steps

1. ✅ Run migrations
2. ✅ Apply post-deployment SQL
3. ✅ Seed initial data (create seed script)
4. ✅ Set up API endpoints using Prisma Client
5. ✅ Configure connection pooling (PgBouncer)
6. ✅ Set up backup strategy
7. ✅ Configure monitoring

## Support & Documentation
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Schema Design Principles
- **Multi-tenancy:** All data isolated by tenant_id with RLS
- **Soft deletes:** deleted_at for audit trail
- **Audit trail:** Comprehensive logging of all changes
- **Performance:** Sub-50ms query response time target
- **Scalability:** Designed for 1000+ tenants
- **Security:** Row-level security on all tenant tables
