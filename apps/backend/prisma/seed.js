"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    log: ['error'],
});
async function main() {
    console.log('🌱 Starting database seed...');
    // Create a demo tenant
    const tenant = await prisma.tenant.upsert({
        where: { subdomain: 'demo-cafe' },
        update: {},
        create: {
            businessName: 'Demo Café',
            subdomain: 'demo-cafe',
            legalEntityName: 'Demo Café LLC',
            planType: 'professional',
            subscriptionStatus: 'active',
            countryCode: 'US',
            currencyCode: 'USD',
            timezone: 'America/New_York',
            maxLocations: 5,
            maxUsers: 20,
            maxProducts: 500,
        },
    });
    console.log('✅ Created tenant:', tenant.businessName);
    // Create a location
    const location = await prisma.location.upsert({
        where: {
            locations_tenant_name_unique: {
                tenantId: tenant.id,
                name: 'Main Street',
            },
        },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'Main Street',
            code: 'MAIN',
            locationType: 'cafe',
            addressLine1: '123 Main Street',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            countryCode: 'US',
            phone: '+1-555-0100',
            email: 'main@democafe.com',
            timezone: 'America/New_York',
            currencyCode: 'USD',
            isActive: true,
        },
    });
    console.log('✅ Created location:', location.name);
    // Create an admin user
    const adminUser = await prisma.user.upsert({
        where: {
            users_tenant_email_unique: {
                tenantId: tenant.id,
                email: 'admin@democafe.com',
            },
        },
        update: {},
        create: {
            tenantId: tenant.id,
            email: 'admin@democafe.com',
            firstName: 'Admin',
            lastName: 'User',
            displayName: 'Admin User',
            role: 'admin',
            permissions: ['can_void_orders', 'can_refund', 'can_edit_prices', 'can_manage_users'],
            employeeCode: 'ADM001',
            jobTitle: 'Store Manager',
            allowedLocations: [location.id],
            isActive: true,
            // Note: In production, use proper password hashing
            passwordHash: '$2b$10$ExampleHashedPassword',
            pinCodeHash: '$2b$10$ExamplePinHash',
        },
    });
    console.log('✅ Created admin user:', adminUser.email);
    // Create categories
    const coffeeCategory = await prisma.category.create({
        data: {
            tenantId: tenant.id,
            name: 'Coffee',
            displayName: 'Coffee',
            sortOrder: 1,
            colorHex: '#6F4E37',
            isActive: true,
        },
    });
    const pastriesCategory = await prisma.category.create({
        data: {
            tenantId: tenant.id,
            name: 'Pastries',
            displayName: 'Pastries',
            sortOrder: 2,
            colorHex: '#DAA520',
            isActive: true,
        },
    });
    const sandwichesCategory = await prisma.category.create({
        data: {
            tenantId: tenant.id,
            name: 'Sandwiches',
            displayName: 'Sandwiches',
            sortOrder: 3,
            colorHex: '#228B22',
            isActive: true,
        },
    });
    const categories = [coffeeCategory, pastriesCategory, sandwichesCategory];
    console.log('✅ Created categories:', categories.length);
    // Create modifier groups
    const sizeGroup = await prisma.modifierGroup.create({
        data: {
            tenantId: tenant.id,
            name: 'Size',
            displayName: 'Choose Size',
            selectionType: 'single',
            isRequired: true,
            minSelections: 1,
            maxSelections: 1,
            sortOrder: 1,
        },
    });
    const milkGroup = await prisma.modifierGroup.create({
        data: {
            tenantId: tenant.id,
            name: 'Milk Options',
            displayName: 'Choose Milk',
            selectionType: 'single',
            isRequired: false,
            minSelections: 0,
            maxSelections: 1,
            sortOrder: 2,
        },
    });
    // Create modifiers for size
    const sizeModifiers = await Promise.all([
        prisma.modifier.create({
            data: {
                tenantId: tenant.id,
                groupId: sizeGroup.id,
                name: 'Small',
                displayName: 'Small (12oz)',
                priceChange: 0.0,
                isDefault: true,
                sortOrder: 1,
            },
        }),
        prisma.modifier.create({
            data: {
                tenantId: tenant.id,
                groupId: sizeGroup.id,
                name: 'Medium',
                displayName: 'Medium (16oz)',
                priceChange: 1.0,
                sortOrder: 2,
            },
        }),
        prisma.modifier.create({
            data: {
                tenantId: tenant.id,
                groupId: sizeGroup.id,
                name: 'Large',
                displayName: 'Large (20oz)',
                priceChange: 2.0,
                sortOrder: 3,
            },
        }),
    ]);
    // Create modifiers for milk
    const milkModifiers = await Promise.all([
        prisma.modifier.create({
            data: {
                tenantId: tenant.id,
                groupId: milkGroup.id,
                name: 'Whole Milk',
                priceChange: 0.0,
                isDefault: true,
                sortOrder: 1,
            },
        }),
        prisma.modifier.create({
            data: {
                tenantId: tenant.id,
                groupId: milkGroup.id,
                name: 'Oat Milk',
                priceChange: 0.75,
                sortOrder: 2,
            },
        }),
        prisma.modifier.create({
            data: {
                tenantId: tenant.id,
                groupId: milkGroup.id,
                name: 'Almond Milk',
                priceChange: 0.75,
                sortOrder: 3,
            },
        }),
    ]);
    console.log('✅ Created modifier groups and modifiers');
    // Create products
    const latte = await prisma.product.create({
        data: {
            tenantId: tenant.id,
            categoryId: categories[0].id,
            name: 'Latte',
            displayName: 'Caffè Latte',
            shortName: 'Latte',
            description: 'Espresso with steamed milk',
            basePrice: 4.5,
            costPrice: 1.2,
            taxRate: 0.08,
            sku: 'COFFEE-LATTE',
            prepTimeMinutes: 3,
            kitchenStation: 'bar',
            isActive: true,
            sortOrder: 1,
        },
    });
    const cappuccino = await prisma.product.create({
        data: {
            tenantId: tenant.id,
            categoryId: categories[0].id,
            name: 'Cappuccino',
            displayName: 'Cappuccino',
            shortName: 'Capp',
            description: 'Espresso with foamed milk',
            basePrice: 4.5,
            costPrice: 1.15,
            taxRate: 0.08,
            sku: 'COFFEE-CAPP',
            prepTimeMinutes: 3,
            kitchenStation: 'bar',
            isActive: true,
            sortOrder: 2,
        },
    });
    const croissant = await prisma.product.create({
        data: {
            tenantId: tenant.id,
            categoryId: categories[1].id,
            name: 'Croissant',
            displayName: 'Butter Croissant',
            shortName: 'Croiss',
            description: 'Freshly baked butter croissant',
            basePrice: 3.5,
            costPrice: 0.8,
            taxRate: 0.08,
            sku: 'PASTRY-CROISSANT',
            prepTimeMinutes: 1,
            kitchenStation: 'pastry',
            trackInventory: true,
            currentStock: 50,
            lowStockThreshold: 10,
            isActive: true,
            sortOrder: 1,
        },
    });
    console.log('✅ Created products:', [latte.name, cappuccino.name, croissant.name]);
    // Link modifiers to products
    await Promise.all([
        prisma.productModifierGroup.create({
            data: {
                tenantId: tenant.id,
                productId: latte.id,
                modifierGroupId: sizeGroup.id,
                isRequired: true,
                sortOrder: 1,
            },
        }),
        prisma.productModifierGroup.create({
            data: {
                tenantId: tenant.id,
                productId: latte.id,
                modifierGroupId: milkGroup.id,
                isRequired: false,
                sortOrder: 2,
            },
        }),
        prisma.productModifierGroup.create({
            data: {
                tenantId: tenant.id,
                productId: cappuccino.id,
                modifierGroupId: sizeGroup.id,
                isRequired: true,
                sortOrder: 1,
            },
        }),
        prisma.productModifierGroup.create({
            data: {
                tenantId: tenant.id,
                productId: cappuccino.id,
                modifierGroupId: milkGroup.id,
                isRequired: false,
                sortOrder: 2,
            },
        }),
    ]);
    console.log('✅ Linked modifiers to products');
    // Create a sample customer
    const customer = await prisma.customer.upsert({
        where: {
            customers_tenant_phone_unique: {
                tenantId: tenant.id,
                phone: '+1-555-1234',
            },
        },
        update: {},
        create: {
            tenantId: tenant.id,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1-555-1234',
            loyaltyMember: true,
            loyaltyTier: 'gold',
            loyaltyPoints: 500,
            marketingOptIn: true,
            smsOptIn: true,
            emailOptIn: true,
        },
    });
    console.log('✅ Created sample customer:', customer.email);
    // Create a terminal
    const terminal = await prisma.terminal.create({
        data: {
            tenantId: tenant.id,
            locationId: location.id,
            terminalName: 'POS Terminal 1',
            terminalNumber: 1,
            deviceId: 'TERM-001-DEMO',
            isMainTerminal: true,
            isActive: true,
            connectionStatus: 'online',
        },
    });
    console.log('✅ Created terminal:', terminal.terminalName);
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`- Tenant: ${tenant.businessName} (${tenant.subdomain})`);
    console.log(`- Location: ${location.name}`);
    console.log(`- Admin User: ${adminUser.email}`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Products: 3`);
    console.log(`- Customer: ${customer.email}`);
    console.log('');
    console.log('🚀 You can now start using the POS system!');
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
