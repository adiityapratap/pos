import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      businessName: 'Demo Restaurant',
      subdomain: 'demo',
      legalEntityName: 'Demo Restaurant LLC',
      planType: 'professional',
      subscriptionStatus: 'active',
      countryCode: 'US',
      currencyCode: 'USD',
      timezone: 'America/New_York',
      maxLocations: 5,
      maxUsers: 20,
      maxProducts: 500,
      features: {
        kds: true,
        loyalty: true,
        analytics: true,
        inventory: true,
      },
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
      locationType: 'restaurant',
      addressLine1: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      countryCode: 'US',
      phone: '+1-555-0100',
      email: 'main@demo.com',
      timezone: 'America/New_York',
      currencyCode: 'USD',
      isActive: true,
    },
  });
  console.log('✅ Created location:', location.name);

  // Hash passwords and PINs for test users
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPinHash = await bcrypt.hash('1234', 10);
  const cashierPinHash = await bcrypt.hash('5678', 10);
  const managerPinHash = await bcrypt.hash('9999', 10);

  // Create an admin/owner user
  const adminUser = await prisma.user.upsert({
    where: {
      users_tenant_email_unique: {
        tenantId: tenant.id,
        email: 'admin@demo.com',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      firstName: 'John',
      lastName: 'Owner',
      displayName: 'John Owner',
      role: 'owner',
      permissions: ['*'], // All permissions
      employeeCode: 'EMP-001',
      jobTitle: 'Owner',
      allowedLocations: [location.id],
      isActive: true,
      passwordHash: passwordHash,
      pinCodeHash: adminPinHash,
    },
  });
  console.log('✅ Created admin user:', adminUser.email, '| PIN: 1234');

  // Create a manager user
  const managerUser = await prisma.user.upsert({
    where: {
      users_tenant_email_unique: {
        tenantId: tenant.id,
        email: 'manager@demo.com',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'manager@demo.com',
      firstName: 'Sarah',
      lastName: 'Manager',
      displayName: 'Sarah Manager',
      role: 'manager',
      permissions: ['can_void_orders', 'can_refund', 'can_edit_prices', 'view_reports'],
      employeeCode: 'EMP-002',
      jobTitle: 'Store Manager',
      allowedLocations: [location.id],
      isActive: true,
      passwordHash: passwordHash,
      pinCodeHash: managerPinHash,
    },
  });
  console.log('✅ Created manager user:', managerUser.email, '| PIN: 9999');

  // Create a cashier user
  const cashierUser = await prisma.user.upsert({
    where: {
      users_tenant_email_unique: {
        tenantId: tenant.id,
        email: 'cashier@demo.com',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'cashier@demo.com',
      firstName: 'Mike',
      lastName: 'Cashier',
      displayName: 'Mike Cashier',
      role: 'cashier',
      permissions: ['take_orders', 'process_payments'],
      employeeCode: 'EMP-003',
      jobTitle: 'Cashier',
      allowedLocations: [location.id],
      isActive: true,
      passwordHash: passwordHash,
      pinCodeHash: cashierPinHash,
    },
  });
  console.log('✅ Created cashier user:', cashierUser.email, '| PIN: 5678');

  // Create PARENT categories (main menu categories) - use findFirst + create pattern for null parentId
  let burgerCategory = await prisma.category.findFirst({
    where: { tenantId: tenant.id, name: 'Burger', parentId: null },
  });
  if (!burgerCategory) {
    burgerCategory = await prisma.category.create({
      data: { tenantId: tenant.id, name: 'Burger', displayName: 'Burger', sortOrder: 1, colorHex: '#F59E0B', isActive: true },
    });
  }

  let noodlesCategory = await prisma.category.findFirst({
    where: { tenantId: tenant.id, name: 'Noodles', parentId: null },
  });
  if (!noodlesCategory) {
    noodlesCategory = await prisma.category.create({
      data: { tenantId: tenant.id, name: 'Noodles', displayName: 'Noodles', sortOrder: 2, colorHex: '#EF4444', isActive: true },
    });
  }

  let drinksCategory = await prisma.category.findFirst({
    where: { tenantId: tenant.id, name: 'Drinks', parentId: null },
  });
  if (!drinksCategory) {
    drinksCategory = await prisma.category.create({
      data: { tenantId: tenant.id, name: 'Drinks', displayName: 'Drinks', sortOrder: 3, colorHex: '#3B82F6', isActive: true },
    });
  }

  let dessertsCategory = await prisma.category.findFirst({
    where: { tenantId: tenant.id, name: 'Desserts', parentId: null },
  });
  if (!dessertsCategory) {
    dessertsCategory = await prisma.category.create({
      data: { tenantId: tenant.id, name: 'Desserts', displayName: 'Desserts', sortOrder: 4, colorHex: '#EC4899', isActive: true },
    });
  }

  let pizzaCategory = await prisma.category.findFirst({
    where: { tenantId: tenant.id, name: 'Pizza', parentId: null },
  });
  if (!pizzaCategory) {
    pizzaCategory = await prisma.category.create({
      data: { tenantId: tenant.id, name: 'Pizza', displayName: 'Pizza', sortOrder: 5, colorHex: '#F97316', isActive: true },
    });
  }

  let chickenCategory = await prisma.category.findFirst({
    where: { tenantId: tenant.id, name: 'Chicken', parentId: null },
  });
  if (!chickenCategory) {
    chickenCategory = await prisma.category.create({
      data: { tenantId: tenant.id, name: 'Chicken', displayName: 'Chicken', sortOrder: 6, colorHex: '#84CC16', isActive: true },
    });
  }

  console.log('✅ Created parent categories: Burger, Noodles, Drinks, Desserts, Pizza, Chicken');

  // Create SUBCATEGORIES for Burger (these have burgerCategory as parent)
  let classicSub = await prisma.category.findFirst({
    where: { tenantId: tenant.id, name: 'Classic', parentId: burgerCategory.id },
  });
  if (!classicSub) {
    classicSub = await prisma.category.create({
      data: { tenantId: tenant.id, name: 'Classic', displayName: 'Classic', parentId: burgerCategory.id, sortOrder: 1, isActive: true },
    });
  }

  let premiumSub = await prisma.category.findFirst({
    where: { tenantId: tenant.id, name: 'Premium', parentId: burgerCategory.id },
  });
  if (!premiumSub) {
    premiumSub = await prisma.category.create({
      data: { tenantId: tenant.id, name: 'Premium', displayName: 'Premium', parentId: burgerCategory.id, sortOrder: 2, isActive: true },
    });
  }

  let veggieSub = await prisma.category.findFirst({
    where: { tenantId: tenant.id, name: 'Veggie', parentId: burgerCategory.id },
  });
  if (!veggieSub) {
    veggieSub = await prisma.category.create({
      data: { tenantId: tenant.id, name: 'Veggie', displayName: 'Veggie', parentId: burgerCategory.id, sortOrder: 3, isActive: true },
    });
  }

  let spicySub = await prisma.category.findFirst({
    where: { tenantId: tenant.id, name: 'Spicy', parentId: burgerCategory.id },
  });
  if (!spicySub) {
    spicySub = await prisma.category.create({
      data: { tenantId: tenant.id, name: 'Spicy', displayName: 'Spicy', parentId: burgerCategory.id, sortOrder: 4, isActive: true },
    });
  }

  let doubleSub = await prisma.category.findFirst({
    where: { tenantId: tenant.id, name: 'Double', parentId: burgerCategory.id },
  });
  if (!doubleSub) {
    doubleSub = await prisma.category.create({
      data: { tenantId: tenant.id, name: 'Double', displayName: 'Double', parentId: burgerCategory.id, sortOrder: 5, isActive: true },
    });
  }

  let chickenBurgerSub = await prisma.category.findFirst({
    where: { tenantId: tenant.id, name: 'Chicken Burger', parentId: burgerCategory.id },
  });
  if (!chickenBurgerSub) {
    chickenBurgerSub = await prisma.category.create({
      data: { tenantId: tenant.id, name: 'Chicken Burger', displayName: 'Chicken', parentId: burgerCategory.id, sortOrder: 6, isActive: true },
    });
  }

  // Create CategoryRelationship to link subcategories to Burger parent
  const burgerSubcategories = [classicSub, premiumSub, veggieSub, spicySub, doubleSub, chickenBurgerSub];
  for (let i = 0; i < burgerSubcategories.length; i++) {
    await prisma.categoryRelationship.upsert({
      where: {
        category_relationships_parent_subcategory_unique: {
          parentCategoryId: burgerCategory.id,
          subcategoryId: burgerSubcategories[i].id,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        parentCategoryId: burgerCategory.id,
        subcategoryId: burgerSubcategories[i].id,
        sortOrder: i,
      },
    });
  }
  console.log('✅ Created Burger subcategories: Classic, Premium, Veggie, Spicy, Double, Chicken');

  // Keep old categories for backward compatibility (will appear as parent categories now)
  let coffeeCategory = await prisma.category.findFirst({
    where: {
      tenantId: tenant.id,
      name: 'Coffee',
      parentId: null,
    },
  });

  if (!coffeeCategory) {
    coffeeCategory = await prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: 'Coffee',
        displayName: 'Coffee',
        sortOrder: 10,
        colorHex: '#6F4E37',
        isActive: true,
      },
    });
  }

  let pastriesCategory = await prisma.category.findFirst({
    where: {
      tenantId: tenant.id,
      name: 'Pastries',
      parentId: null,
    },
  });

  if (!pastriesCategory) {
    pastriesCategory = await prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: 'Pastries',
        displayName: 'Pastries',
        sortOrder: 11,
        colorHex: '#DAA520',
        isActive: true,
      },
    });
  }

  let sandwichesCategory = await prisma.category.findFirst({
    where: {
      tenantId: tenant.id,
      name: 'Sandwiches',
      parentId: null,
    },
  });

  if (!sandwichesCategory) {
    sandwichesCategory = await prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: 'Sandwiches',
        displayName: 'Sandwiches',
        sortOrder: 12,
        colorHex: '#228B22',
        isActive: true,
      },
    });
  }

  const categories = [coffeeCategory, pastriesCategory, sandwichesCategory];
  console.log('✅ Created categories:', categories.length);

  // Create modifier groups (using upsert to make it idempotent)
  const sizeGroup = await prisma.modifierGroup.upsert({
    where: {
      modifier_groups_tenant_name_unique: {
        tenantId: tenant.id,
        name: 'Size',
      },
    },
    update: {},
    create: {
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

  const milkGroup = await prisma.modifierGroup.upsert({
    where: {
      modifier_groups_tenant_name_unique: {
        tenantId: tenant.id,
        name: 'Milk Options',
      },
    },
    update: {},
    create: {
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

  // Create modifiers for size (using upsert)
  const smallSize = await prisma.modifier.upsert({
    where: {
      modifiers_group_name_unique: {
        groupId: sizeGroup.id,
        name: 'Small',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      groupId: sizeGroup.id,
      name: 'Small',
      displayName: 'Small (12oz)',
      priceChange: 0.0,
      isDefault: true,
      sortOrder: 1,
    },
  });

  const mediumSize = await prisma.modifier.upsert({
    where: {
      modifiers_group_name_unique: {
        groupId: sizeGroup.id,
        name: 'Medium',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      groupId: sizeGroup.id,
      name: 'Medium',
      displayName: 'Medium (16oz)',
      priceChange: 1.0,
      sortOrder: 2,
    },
  });

  const largeSize = await prisma.modifier.upsert({
    where: {
      modifiers_group_name_unique: {
        groupId: sizeGroup.id,
        name: 'Large',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      groupId: sizeGroup.id,
      name: 'Large',
      displayName: 'Large (20oz)',
      priceChange: 2.0,
      sortOrder: 3,
    },
  });

  // Create modifiers for milk (using upsert)
  const wholeMilk = await prisma.modifier.upsert({
    where: {
      modifiers_group_name_unique: {
        groupId: milkGroup.id,
        name: 'Whole Milk',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      groupId: milkGroup.id,
      name: 'Whole Milk',
      priceChange: 0.0,
      isDefault: true,
      sortOrder: 1,
    },
  });

  const oatMilk = await prisma.modifier.upsert({
    where: {
      modifiers_group_name_unique: {
        groupId: milkGroup.id,
        name: 'Oat Milk',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      groupId: milkGroup.id,
      name: 'Oat Milk',
      priceChange: 0.75,
      sortOrder: 2,
    },
  });

  const almondMilk = await prisma.modifier.upsert({
    where: {
      modifiers_group_name_unique: {
        groupId: milkGroup.id,
        name: 'Almond Milk',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      groupId: milkGroup.id,
      name: 'Almond Milk',
      priceChange: 0.75,
      sortOrder: 3,
    },
  });

  console.log('✅ Created modifier groups and modifiers');

  // ===========================================
  // CREATE BURGER MODIFIER GROUPS
  // ===========================================
  const burgerPattyGroup = await prisma.modifierGroup.upsert({
    where: {
      modifier_groups_tenant_name_unique: {
        tenantId: tenant.id,
        name: 'Burger Patty',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Burger Patty',
      displayName: 'Choose Patty',
      selectionType: 'single',
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      sortOrder: 1,
    },
  });

  const burgerToppingsGroup = await prisma.modifierGroup.upsert({
    where: {
      modifier_groups_tenant_name_unique: {
        tenantId: tenant.id,
        name: 'Burger Toppings',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Burger Toppings',
      displayName: 'Add Toppings',
      selectionType: 'multiple',
      isRequired: false,
      minSelections: 0,
      maxSelections: 5,
      sortOrder: 2,
    },
  });

  const burgerSauceGroup = await prisma.modifierGroup.upsert({
    where: {
      modifier_groups_tenant_name_unique: {
        tenantId: tenant.id,
        name: 'Burger Sauce',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Burger Sauce',
      displayName: 'Choose Sauce',
      selectionType: 'single',
      isRequired: false,
      minSelections: 0,
      maxSelections: 1,
      sortOrder: 3,
    },
  });

  // Create burger patty modifiers
  await prisma.modifier.upsert({
    where: { modifiers_group_name_unique: { groupId: burgerPattyGroup.id, name: 'Single Patty' } },
    update: {},
    create: { tenantId: tenant.id, groupId: burgerPattyGroup.id, name: 'Single Patty', displayName: 'Single Patty', priceChange: 0, isDefault: true, sortOrder: 1 },
  });
  await prisma.modifier.upsert({
    where: { modifiers_group_name_unique: { groupId: burgerPattyGroup.id, name: 'Double Patty' } },
    update: {},
    create: { tenantId: tenant.id, groupId: burgerPattyGroup.id, name: 'Double Patty', displayName: 'Double Patty', priceChange: 5, sortOrder: 2 },
  });
  await prisma.modifier.upsert({
    where: { modifiers_group_name_unique: { groupId: burgerPattyGroup.id, name: 'Triple Patty' } },
    update: {},
    create: { tenantId: tenant.id, groupId: burgerPattyGroup.id, name: 'Triple Patty', displayName: 'Triple Patty', priceChange: 10, sortOrder: 3 },
  });

  // Create burger topping modifiers
  await prisma.modifier.upsert({
    where: { modifiers_group_name_unique: { groupId: burgerToppingsGroup.id, name: 'Extra Cheese' } },
    update: {},
    create: { tenantId: tenant.id, groupId: burgerToppingsGroup.id, name: 'Extra Cheese', displayName: 'Extra Cheese', priceChange: 2, sortOrder: 1 },
  });
  await prisma.modifier.upsert({
    where: { modifiers_group_name_unique: { groupId: burgerToppingsGroup.id, name: 'Bacon' } },
    update: {},
    create: { tenantId: tenant.id, groupId: burgerToppingsGroup.id, name: 'Bacon', displayName: 'Bacon', priceChange: 3, sortOrder: 2 },
  });
  await prisma.modifier.upsert({
    where: { modifiers_group_name_unique: { groupId: burgerToppingsGroup.id, name: 'Jalapeños' } },
    update: {},
    create: { tenantId: tenant.id, groupId: burgerToppingsGroup.id, name: 'Jalapeños', displayName: 'Jalapeños', priceChange: 1, sortOrder: 3 },
  });
  await prisma.modifier.upsert({
    where: { modifiers_group_name_unique: { groupId: burgerToppingsGroup.id, name: 'Avocado' } },
    update: {},
    create: { tenantId: tenant.id, groupId: burgerToppingsGroup.id, name: 'Avocado', displayName: 'Avocado', priceChange: 3, sortOrder: 4 },
  });
  await prisma.modifier.upsert({
    where: { modifiers_group_name_unique: { groupId: burgerToppingsGroup.id, name: 'Fried Egg' } },
    update: {},
    create: { tenantId: tenant.id, groupId: burgerToppingsGroup.id, name: 'Fried Egg', displayName: 'Fried Egg', priceChange: 2, sortOrder: 5 },
  });

  // Create burger sauce modifiers
  await prisma.modifier.upsert({
    where: { modifiers_group_name_unique: { groupId: burgerSauceGroup.id, name: 'Ketchup' } },
    update: {},
    create: { tenantId: tenant.id, groupId: burgerSauceGroup.id, name: 'Ketchup', displayName: 'Ketchup', priceChange: 0, isDefault: true, sortOrder: 1 },
  });
  await prisma.modifier.upsert({
    where: { modifiers_group_name_unique: { groupId: burgerSauceGroup.id, name: 'BBQ Sauce' } },
    update: {},
    create: { tenantId: tenant.id, groupId: burgerSauceGroup.id, name: 'BBQ Sauce', displayName: 'BBQ Sauce', priceChange: 0, sortOrder: 2 },
  });
  await prisma.modifier.upsert({
    where: { modifiers_group_name_unique: { groupId: burgerSauceGroup.id, name: 'Mayo' } },
    update: {},
    create: { tenantId: tenant.id, groupId: burgerSauceGroup.id, name: 'Mayo', displayName: 'Mayo', priceChange: 0, sortOrder: 3 },
  });
  await prisma.modifier.upsert({
    where: { modifiers_group_name_unique: { groupId: burgerSauceGroup.id, name: 'Spicy Mayo' } },
    update: {},
    create: { tenantId: tenant.id, groupId: burgerSauceGroup.id, name: 'Spicy Mayo', displayName: 'Spicy Mayo', priceChange: 1, sortOrder: 4 },
  });

  console.log('✅ Created burger modifier groups and modifiers');

  // ===========================================
  // CREATE PIZZA MODIFIER GROUPS
  // ===========================================
  const pizzaSizeGroup = await prisma.modifierGroup.upsert({
    where: { modifier_groups_tenant_name_unique: { tenantId: tenant.id, name: 'Pizza Size' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Pizza Size', displayName: 'Choose Size', selectionType: 'single', isRequired: true, minSelections: 1, maxSelections: 1, sortOrder: 1 },
  });

  const pizzaCrustGroup = await prisma.modifierGroup.upsert({
    where: { modifier_groups_tenant_name_unique: { tenantId: tenant.id, name: 'Pizza Crust' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Pizza Crust', displayName: 'Choose Crust', selectionType: 'single', isRequired: true, minSelections: 1, maxSelections: 1, sortOrder: 2 },
  });

  const pizzaToppingsGroup = await prisma.modifierGroup.upsert({
    where: { modifier_groups_tenant_name_unique: { tenantId: tenant.id, name: 'Extra Toppings' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Extra Toppings', displayName: 'Add Toppings', selectionType: 'multiple', isRequired: false, minSelections: 0, maxSelections: 6, sortOrder: 3 },
  });

  // Pizza size modifiers
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: pizzaSizeGroup.id, name: 'Personal' } }, update: {}, create: { tenantId: tenant.id, groupId: pizzaSizeGroup.id, name: 'Personal', displayName: 'Personal (8")', priceChange: 0, isDefault: true, sortOrder: 1 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: pizzaSizeGroup.id, name: 'Medium' } }, update: {}, create: { tenantId: tenant.id, groupId: pizzaSizeGroup.id, name: 'Medium', displayName: 'Medium (12")', priceChange: 5, sortOrder: 2 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: pizzaSizeGroup.id, name: 'Large' } }, update: {}, create: { tenantId: tenant.id, groupId: pizzaSizeGroup.id, name: 'Large', displayName: 'Large (16")', priceChange: 10, sortOrder: 3 } });

  // Pizza crust modifiers
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: pizzaCrustGroup.id, name: 'Classic Crust' } }, update: {}, create: { tenantId: tenant.id, groupId: pizzaCrustGroup.id, name: 'Classic Crust', displayName: 'Classic', priceChange: 0, isDefault: true, sortOrder: 1 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: pizzaCrustGroup.id, name: 'Thin Crust' } }, update: {}, create: { tenantId: tenant.id, groupId: pizzaCrustGroup.id, name: 'Thin Crust', displayName: 'Thin & Crispy', priceChange: 0, sortOrder: 2 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: pizzaCrustGroup.id, name: 'Stuffed Crust' } }, update: {}, create: { tenantId: tenant.id, groupId: pizzaCrustGroup.id, name: 'Stuffed Crust', displayName: 'Cheese Stuffed', priceChange: 4, sortOrder: 3 } });

  // Pizza topping modifiers
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: pizzaToppingsGroup.id, name: 'Extra Cheese' } }, update: {}, create: { tenantId: tenant.id, groupId: pizzaToppingsGroup.id, name: 'Extra Cheese', displayName: 'Extra Cheese', priceChange: 3, sortOrder: 1 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: pizzaToppingsGroup.id, name: 'Pepperoni' } }, update: {}, create: { tenantId: tenant.id, groupId: pizzaToppingsGroup.id, name: 'Pepperoni', displayName: 'Pepperoni', priceChange: 2, sortOrder: 2 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: pizzaToppingsGroup.id, name: 'Mushrooms' } }, update: {}, create: { tenantId: tenant.id, groupId: pizzaToppingsGroup.id, name: 'Mushrooms', displayName: 'Mushrooms', priceChange: 2, sortOrder: 3 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: pizzaToppingsGroup.id, name: 'Olives' } }, update: {}, create: { tenantId: tenant.id, groupId: pizzaToppingsGroup.id, name: 'Olives', displayName: 'Black Olives', priceChange: 2, sortOrder: 4 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: pizzaToppingsGroup.id, name: 'Onions' } }, update: {}, create: { tenantId: tenant.id, groupId: pizzaToppingsGroup.id, name: 'Onions', displayName: 'Onions', priceChange: 1, sortOrder: 5 } });

  console.log('✅ Created pizza modifier groups');

  // ===========================================
  // CREATE NOODLES MODIFIER GROUPS
  // ===========================================
  const noodleSpiceGroup = await prisma.modifierGroup.upsert({
    where: { modifier_groups_tenant_name_unique: { tenantId: tenant.id, name: 'Spice Level' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Spice Level', displayName: 'Choose Spice Level', selectionType: 'single', isRequired: true, minSelections: 1, maxSelections: 1, sortOrder: 1 },
  });

  const noodleProteinGroup = await prisma.modifierGroup.upsert({
    where: { modifier_groups_tenant_name_unique: { tenantId: tenant.id, name: 'Add Protein' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Add Protein', displayName: 'Add Protein', selectionType: 'single', isRequired: false, minSelections: 0, maxSelections: 1, sortOrder: 2 },
  });

  // Noodle spice modifiers
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: noodleSpiceGroup.id, name: 'Mild' } }, update: {}, create: { tenantId: tenant.id, groupId: noodleSpiceGroup.id, name: 'Mild', displayName: 'Mild', priceChange: 0, isDefault: true, sortOrder: 1 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: noodleSpiceGroup.id, name: 'Medium Spice' } }, update: {}, create: { tenantId: tenant.id, groupId: noodleSpiceGroup.id, name: 'Medium Spice', displayName: 'Medium', priceChange: 0, sortOrder: 2 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: noodleSpiceGroup.id, name: 'Hot' } }, update: {}, create: { tenantId: tenant.id, groupId: noodleSpiceGroup.id, name: 'Hot', displayName: 'Hot', priceChange: 0, sortOrder: 3 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: noodleSpiceGroup.id, name: 'Extra Hot' } }, update: {}, create: { tenantId: tenant.id, groupId: noodleSpiceGroup.id, name: 'Extra Hot', displayName: 'Extra Hot 🔥', priceChange: 0, sortOrder: 4 } });

  // Noodle protein modifiers
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: noodleProteinGroup.id, name: 'Chicken' } }, update: {}, create: { tenantId: tenant.id, groupId: noodleProteinGroup.id, name: 'Chicken', displayName: 'Grilled Chicken', priceChange: 5, sortOrder: 1 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: noodleProteinGroup.id, name: 'Beef' } }, update: {}, create: { tenantId: tenant.id, groupId: noodleProteinGroup.id, name: 'Beef', displayName: 'Beef Strips', priceChange: 6, sortOrder: 2 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: noodleProteinGroup.id, name: 'Shrimp' } }, update: {}, create: { tenantId: tenant.id, groupId: noodleProteinGroup.id, name: 'Shrimp', displayName: 'Shrimp', priceChange: 7, sortOrder: 3 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: noodleProteinGroup.id, name: 'Tofu' } }, update: {}, create: { tenantId: tenant.id, groupId: noodleProteinGroup.id, name: 'Tofu', displayName: 'Crispy Tofu', priceChange: 4, sortOrder: 4 } });

  console.log('✅ Created noodles modifier groups');

  // ===========================================
  // CREATE DRINKS MODIFIER GROUPS
  // ===========================================
  const drinkSizeGroup = await prisma.modifierGroup.upsert({
    where: { modifier_groups_tenant_name_unique: { tenantId: tenant.id, name: 'Drink Size' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Drink Size', displayName: 'Choose Size', selectionType: 'single', isRequired: true, minSelections: 1, maxSelections: 1, sortOrder: 1 },
  });

  const drinkIceGroup = await prisma.modifierGroup.upsert({
    where: { modifier_groups_tenant_name_unique: { tenantId: tenant.id, name: 'Ice Level' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Ice Level', displayName: 'Ice Preference', selectionType: 'single', isRequired: false, minSelections: 0, maxSelections: 1, sortOrder: 2 },
  });

  // Drink size modifiers
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: drinkSizeGroup.id, name: 'Regular' } }, update: {}, create: { tenantId: tenant.id, groupId: drinkSizeGroup.id, name: 'Regular', displayName: 'Regular (16oz)', priceChange: 0, isDefault: true, sortOrder: 1 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: drinkSizeGroup.id, name: 'Large Drink' } }, update: {}, create: { tenantId: tenant.id, groupId: drinkSizeGroup.id, name: 'Large Drink', displayName: 'Large (22oz)', priceChange: 2, sortOrder: 2 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: drinkSizeGroup.id, name: 'XL' } }, update: {}, create: { tenantId: tenant.id, groupId: drinkSizeGroup.id, name: 'XL', displayName: 'XL (32oz)', priceChange: 4, sortOrder: 3 } });

  // Drink ice modifiers
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: drinkIceGroup.id, name: 'Regular Ice' } }, update: {}, create: { tenantId: tenant.id, groupId: drinkIceGroup.id, name: 'Regular Ice', displayName: 'Regular Ice', priceChange: 0, isDefault: true, sortOrder: 1 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: drinkIceGroup.id, name: 'Light Ice' } }, update: {}, create: { tenantId: tenant.id, groupId: drinkIceGroup.id, name: 'Light Ice', displayName: 'Light Ice', priceChange: 0, sortOrder: 2 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: drinkIceGroup.id, name: 'No Ice' } }, update: {}, create: { tenantId: tenant.id, groupId: drinkIceGroup.id, name: 'No Ice', displayName: 'No Ice', priceChange: 0, sortOrder: 3 } });

  console.log('✅ Created drinks modifier groups');

  // ===========================================
  // CREATE CHICKEN MODIFIER GROUPS
  // ===========================================
  const chickenStyleGroup = await prisma.modifierGroup.upsert({
    where: { modifier_groups_tenant_name_unique: { tenantId: tenant.id, name: 'Chicken Style' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Chicken Style', displayName: 'Choose Style', selectionType: 'single', isRequired: true, minSelections: 1, maxSelections: 1, sortOrder: 1 },
  });

  const chickenDipGroup = await prisma.modifierGroup.upsert({
    where: { modifier_groups_tenant_name_unique: { tenantId: tenant.id, name: 'Dipping Sauce' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Dipping Sauce', displayName: 'Choose Dip', selectionType: 'single', isRequired: false, minSelections: 0, maxSelections: 2, sortOrder: 2 },
  });

  // Chicken style modifiers
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: chickenStyleGroup.id, name: 'Original Recipe' } }, update: {}, create: { tenantId: tenant.id, groupId: chickenStyleGroup.id, name: 'Original Recipe', displayName: 'Original', priceChange: 0, isDefault: true, sortOrder: 1 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: chickenStyleGroup.id, name: 'Crispy' } }, update: {}, create: { tenantId: tenant.id, groupId: chickenStyleGroup.id, name: 'Crispy', displayName: 'Extra Crispy', priceChange: 1, sortOrder: 2 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: chickenStyleGroup.id, name: 'Grilled' } }, update: {}, create: { tenantId: tenant.id, groupId: chickenStyleGroup.id, name: 'Grilled', displayName: 'Grilled', priceChange: 0, sortOrder: 3 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: chickenStyleGroup.id, name: 'Spicy Hot' } }, update: {}, create: { tenantId: tenant.id, groupId: chickenStyleGroup.id, name: 'Spicy Hot', displayName: 'Spicy', priceChange: 0, sortOrder: 4 } });

  // Chicken dipping sauce modifiers
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: chickenDipGroup.id, name: 'Ranch' } }, update: {}, create: { tenantId: tenant.id, groupId: chickenDipGroup.id, name: 'Ranch', displayName: 'Ranch', priceChange: 0, sortOrder: 1 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: chickenDipGroup.id, name: 'BBQ' } }, update: {}, create: { tenantId: tenant.id, groupId: chickenDipGroup.id, name: 'BBQ', displayName: 'BBQ', priceChange: 0, sortOrder: 2 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: chickenDipGroup.id, name: 'Honey Mustard' } }, update: {}, create: { tenantId: tenant.id, groupId: chickenDipGroup.id, name: 'Honey Mustard', displayName: 'Honey Mustard', priceChange: 0, sortOrder: 3 } });
  await prisma.modifier.upsert({ where: { modifiers_group_name_unique: { groupId: chickenDipGroup.id, name: 'Buffalo' } }, update: {}, create: { tenantId: tenant.id, groupId: chickenDipGroup.id, name: 'Buffalo', displayName: 'Buffalo', priceChange: 0, sortOrder: 4 } });

  console.log('✅ Created chicken modifier groups');

  // ===========================================
  // CREATE BURGER PRODUCTS (for Classic subcategory)
  // ===========================================
  const burgerProducts = [
    { name: 'Original Burger', price: 59, sub: classicSub },
    { name: 'Cheese Burger', price: 69, sub: classicSub },
    { name: 'Bacon Burger', price: 79, sub: classicSub },
    { name: 'Veggie Burger', price: 49, sub: veggieSub },
    { name: 'BBQ Burger', price: 89, sub: premiumSub },
    { name: 'Spicy Burger', price: 65, sub: spicySub },
    { name: 'Chicken Burger', price: 72, sub: chickenBurgerSub },
    { name: 'Fish Burger', price: 82, sub: classicSub },
    { name: 'Mushroom Burger', price: 67, sub: veggieSub },
    { name: 'Double Burger', price: 99, sub: doubleSub },
  ];

  const createdBurgerProducts: any[] = [];
  for (const bp of burgerProducts) {
    const burgerProduct = await prisma.product.upsert({
      where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: bp.name, categoryId: bp.sub.id } },
      update: {},
      create: {
        tenantId: tenant.id,
        categoryId: bp.sub.id,
        name: bp.name,
        displayName: bp.name,
        shortName: bp.name.split(' ')[0],
        description: `Delicious ${bp.name.toLowerCase()}`,
        basePrice: bp.price,
        productType: 'prepared',
        sortOrder: 0,
        isActive: true,
        availableForPos: true,
      },
    });
    createdBurgerProducts.push(burgerProduct);
  }
  console.log('✅ Created 10 burger products');

  // Link modifier groups to all burger products
  for (const burgerProduct of createdBurgerProducts) {
    // Link patty group
    await prisma.productModifierGroup.upsert({
      where: { product_modifier_groups_unique: { productId: burgerProduct.id, modifierGroupId: burgerPattyGroup.id } },
      update: {},
      create: { tenantId: tenant.id, productId: burgerProduct.id, modifierGroupId: burgerPattyGroup.id, isRequired: true, sortOrder: 1 },
    });
    // Link toppings group
    await prisma.productModifierGroup.upsert({
      where: { product_modifier_groups_unique: { productId: burgerProduct.id, modifierGroupId: burgerToppingsGroup.id } },
      update: {},
      create: { tenantId: tenant.id, productId: burgerProduct.id, modifierGroupId: burgerToppingsGroup.id, isRequired: false, sortOrder: 2 },
    });
    // Link sauce group
    await prisma.productModifierGroup.upsert({
      where: { product_modifier_groups_unique: { productId: burgerProduct.id, modifierGroupId: burgerSauceGroup.id } },
      update: {},
      create: { tenantId: tenant.id, productId: burgerProduct.id, modifierGroupId: burgerSauceGroup.id, isRequired: false, sortOrder: 3 },
    });
  }
  console.log('✅ Linked modifier groups to burger products');

  // ===========================================
  // CREATE NOODLES PRODUCTS (10 products)
  // ===========================================
  const noodleProducts = [
    { name: 'Pad Thai', price: 89, desc: 'Classic Thai stir-fried noodles with peanuts', hasModifiers: true },
    { name: 'Chicken Chow Mein', price: 79, desc: 'Crispy noodles with chicken and vegetables', hasModifiers: true },
    { name: 'Beef Lo Mein', price: 85, desc: 'Soft egg noodles with tender beef', hasModifiers: true },
    { name: 'Singapore Noodles', price: 82, desc: 'Curry-flavored rice noodles', hasModifiers: true },
    { name: 'Shrimp Fried Noodles', price: 95, desc: 'Wok-fried noodles with jumbo shrimp', hasModifiers: true },
    { name: 'Vegetable Hakka Noodles', price: 65, desc: 'Indo-Chinese style vegetable noodles', hasModifiers: false },
    { name: 'Dan Dan Noodles', price: 78, desc: 'Spicy Sichuan noodles with minced pork', hasModifiers: true },
    { name: 'Udon Stir Fry', price: 88, desc: 'Thick udon noodles with vegetables', hasModifiers: false },
    { name: 'Ramen Bowl', price: 92, desc: 'Japanese ramen with rich pork broth', hasModifiers: true },
    { name: 'Glass Noodle Salad', price: 72, desc: 'Cold glass noodles with Thai dressing', hasModifiers: false },
  ];

  const createdNoodleProducts: any[] = [];
  for (let i = 0; i < noodleProducts.length; i++) {
    const np = noodleProducts[i];
    const noodleProduct = await prisma.product.upsert({
      where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: np.name, categoryId: noodlesCategory.id } },
      update: {},
      create: { tenantId: tenant.id, categoryId: noodlesCategory.id, name: np.name, displayName: np.name, shortName: np.name.split(' ')[0], description: np.desc, basePrice: np.price, productType: 'prepared', sortOrder: i, isActive: true, availableForPos: true },
    });
    if (np.hasModifiers) createdNoodleProducts.push(noodleProduct);
  }

  // Link modifiers to noodle products (only those with hasModifiers)
  for (const noodleProduct of createdNoodleProducts) {
    await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: noodleProduct.id, modifierGroupId: noodleSpiceGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: noodleProduct.id, modifierGroupId: noodleSpiceGroup.id, isRequired: true, sortOrder: 1 } });
    await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: noodleProduct.id, modifierGroupId: noodleProteinGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: noodleProduct.id, modifierGroupId: noodleProteinGroup.id, isRequired: false, sortOrder: 2 } });
  }
  console.log('✅ Created 10 noodle products (7 with modifiers, 3 without)');

  // ===========================================
  // CREATE DRINKS PRODUCTS (10 products)
  // ===========================================
  const drinkProducts = [
    { name: 'Coca Cola', price: 25, desc: 'Classic Coca Cola', hasModifiers: true },
    { name: 'Sprite', price: 25, desc: 'Lemon-lime soda', hasModifiers: true },
    { name: 'Fanta Orange', price: 25, desc: 'Orange flavored soda', hasModifiers: true },
    { name: 'Lemonade', price: 35, desc: 'Fresh squeezed lemonade', hasModifiers: true },
    { name: 'Iced Tea', price: 30, desc: 'Refreshing iced tea', hasModifiers: true },
    { name: 'Mango Smoothie', price: 55, desc: 'Fresh mango smoothie', hasModifiers: false },
    { name: 'Strawberry Shake', price: 65, desc: 'Thick strawberry milkshake', hasModifiers: false },
    { name: 'Fresh Orange Juice', price: 45, desc: 'Freshly squeezed orange juice', hasModifiers: false },
    { name: 'Mineral Water', price: 20, desc: 'Sparkling mineral water', hasModifiers: false },
    { name: 'Energy Drink', price: 40, desc: 'Boost your energy', hasModifiers: true },
  ];

  const createdDrinkProducts: any[] = [];
  for (let i = 0; i < drinkProducts.length; i++) {
    const dp = drinkProducts[i];
    const drinkProduct = await prisma.product.upsert({
      where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: dp.name, categoryId: drinksCategory.id } },
      update: {},
      create: { tenantId: tenant.id, categoryId: drinksCategory.id, name: dp.name, displayName: dp.name, shortName: dp.name.split(' ')[0], description: dp.desc, basePrice: dp.price, productType: 'prepared', sortOrder: i, isActive: true, availableForPos: true },
    });
    if (dp.hasModifiers) createdDrinkProducts.push(drinkProduct);
  }

  // Link modifiers to drink products
  for (const drinkProduct of createdDrinkProducts) {
    await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: drinkProduct.id, modifierGroupId: drinkSizeGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: drinkProduct.id, modifierGroupId: drinkSizeGroup.id, isRequired: true, sortOrder: 1 } });
    await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: drinkProduct.id, modifierGroupId: drinkIceGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: drinkProduct.id, modifierGroupId: drinkIceGroup.id, isRequired: false, sortOrder: 2 } });
  }
  console.log('✅ Created 10 drink products (6 with modifiers, 4 without)');

  // ===========================================
  // CREATE DESSERTS PRODUCTS (10 products)
  // ===========================================
  const dessertProducts = [
    { name: 'Chocolate Brownie', price: 45, desc: 'Rich chocolate brownie with walnuts' },
    { name: 'Cheesecake Slice', price: 65, desc: 'New York style cheesecake' },
    { name: 'Tiramisu', price: 75, desc: 'Classic Italian tiramisu' },
    { name: 'Ice Cream Sundae', price: 55, desc: 'Vanilla ice cream with toppings' },
    { name: 'Apple Pie', price: 50, desc: 'Warm apple pie with cinnamon' },
    { name: 'Chocolate Lava Cake', price: 85, desc: 'Molten chocolate center cake' },
    { name: 'Fruit Tart', price: 60, desc: 'Fresh fruit on pastry cream' },
    { name: 'Panna Cotta', price: 55, desc: 'Italian cream dessert with berry sauce' },
    { name: 'Churros', price: 40, desc: 'Fried dough with chocolate sauce' },
    { name: 'Creme Brulee', price: 70, desc: 'French vanilla custard with caramel top' },
  ];

  for (let i = 0; i < dessertProducts.length; i++) {
    const dp = dessertProducts[i];
    await prisma.product.upsert({
      where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: dp.name, categoryId: dessertsCategory.id } },
      update: {},
      create: { tenantId: tenant.id, categoryId: dessertsCategory.id, name: dp.name, displayName: dp.name, shortName: dp.name.split(' ')[0], description: dp.desc, basePrice: dp.price, productType: 'prepared', sortOrder: i, isActive: true, availableForPos: true },
    });
  }
  console.log('✅ Created 10 dessert products (no modifiers - simple items)');

  // ===========================================
  // CREATE PIZZA PRODUCTS (10 products)
  // ===========================================
  const pizzaProducts = [
    { name: 'Margherita Pizza', price: 129, desc: 'Tomato, mozzarella, basil', hasModifiers: true },
    { name: 'Pepperoni Pizza', price: 149, desc: 'Classic pepperoni with cheese', hasModifiers: true },
    { name: 'BBQ Chicken Pizza', price: 169, desc: 'BBQ sauce, chicken, onions', hasModifiers: true },
    { name: 'Veggie Supreme', price: 159, desc: 'Bell peppers, mushrooms, olives, onions', hasModifiers: true },
    { name: 'Meat Lovers', price: 189, desc: 'Pepperoni, sausage, bacon, ham', hasModifiers: true },
    { name: 'Hawaiian Pizza', price: 155, desc: 'Ham and pineapple', hasModifiers: true },
    { name: 'Buffalo Chicken', price: 175, desc: 'Spicy buffalo chicken with ranch', hasModifiers: true },
    { name: 'Four Cheese', price: 165, desc: 'Mozzarella, cheddar, parmesan, gorgonzola', hasModifiers: false },
    { name: 'Garlic Bread Pizza', price: 99, desc: 'Garlic butter base with cheese', hasModifiers: false },
    { name: 'Mushroom Truffle', price: 199, desc: 'Wild mushrooms with truffle oil', hasModifiers: true },
  ];

  const createdPizzaProducts: any[] = [];
  for (let i = 0; i < pizzaProducts.length; i++) {
    const pp = pizzaProducts[i];
    const pizzaProduct = await prisma.product.upsert({
      where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: pp.name, categoryId: pizzaCategory.id } },
      update: {},
      create: { tenantId: tenant.id, categoryId: pizzaCategory.id, name: pp.name, displayName: pp.name, shortName: pp.name.split(' ')[0], description: pp.desc, basePrice: pp.price, productType: 'prepared', sortOrder: i, isActive: true, availableForPos: true },
    });
    if (pp.hasModifiers) createdPizzaProducts.push(pizzaProduct);
  }

  // Link modifiers to pizza products
  for (const pizzaProduct of createdPizzaProducts) {
    await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: pizzaProduct.id, modifierGroupId: pizzaSizeGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: pizzaProduct.id, modifierGroupId: pizzaSizeGroup.id, isRequired: true, sortOrder: 1 } });
    await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: pizzaProduct.id, modifierGroupId: pizzaCrustGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: pizzaProduct.id, modifierGroupId: pizzaCrustGroup.id, isRequired: true, sortOrder: 2 } });
    await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: pizzaProduct.id, modifierGroupId: pizzaToppingsGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: pizzaProduct.id, modifierGroupId: pizzaToppingsGroup.id, isRequired: false, sortOrder: 3 } });
  }
  console.log('✅ Created 10 pizza products (8 with modifiers, 2 without)');

  // ===========================================
  // CREATE CHICKEN PRODUCTS (10 products)
  // ===========================================
  const chickenProducts = [
    { name: 'Fried Chicken 2pc', price: 79, desc: '2 pieces of crispy fried chicken', hasModifiers: true },
    { name: 'Fried Chicken 4pc', price: 149, desc: '4 pieces of crispy fried chicken', hasModifiers: true },
    { name: 'Chicken Wings 6pc', price: 89, desc: '6 wings with your choice of sauce', hasModifiers: true },
    { name: 'Chicken Wings 12pc', price: 159, desc: '12 wings with your choice of sauce', hasModifiers: true },
    { name: 'Chicken Tenders', price: 99, desc: 'Crispy chicken tenders', hasModifiers: true },
    { name: 'Chicken Sandwich', price: 85, desc: 'Crispy chicken breast sandwich', hasModifiers: true },
    { name: 'Grilled Chicken Salad', price: 95, desc: 'Grilled chicken on fresh greens', hasModifiers: false },
    { name: 'Chicken Popcorn', price: 65, desc: 'Bite-sized popcorn chicken', hasModifiers: true },
    { name: 'Chicken Bucket', price: 299, desc: '8 pieces for the family', hasModifiers: false },
    { name: 'Chicken Wrap', price: 79, desc: 'Grilled chicken wrap with veggies', hasModifiers: false },
  ];

  const createdChickenProducts: any[] = [];
  for (let i = 0; i < chickenProducts.length; i++) {
    const cp = chickenProducts[i];
    const chickenProduct = await prisma.product.upsert({
      where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: cp.name, categoryId: chickenCategory.id } },
      update: {},
      create: { tenantId: tenant.id, categoryId: chickenCategory.id, name: cp.name, displayName: cp.name, shortName: cp.name.split(' ')[0], description: cp.desc, basePrice: cp.price, productType: 'prepared', sortOrder: i, isActive: true, availableForPos: true },
    });
    if (cp.hasModifiers) createdChickenProducts.push(chickenProduct);
  }

  // Link modifiers to chicken products
  for (const chickenProduct of createdChickenProducts) {
    await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: chickenProduct.id, modifierGroupId: chickenStyleGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: chickenProduct.id, modifierGroupId: chickenStyleGroup.id, isRequired: true, sortOrder: 1 } });
    await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: chickenProduct.id, modifierGroupId: chickenDipGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: chickenProduct.id, modifierGroupId: chickenDipGroup.id, isRequired: false, sortOrder: 2 } });
  }
  console.log('✅ Created 10 chicken products (7 with modifiers, 3 without)');

  // Create products from screenshot
  // Coffee category products
  const flatWhite = await prisma.product.upsert({
    where: {
      products_tenant_name_category_unique: {
        tenantId: tenant.id,
        name: 'Flat White',
        categoryId: categories[0].id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: categories[0].id,
      name: 'Flat White',
      displayName: 'Flat White',
      shortName: 'Flat White',
      description: 'Smooth espresso with microfoam',
      basePrice: 4.5,
      costPrice: 1.2,
      taxRate: 0.08,
      sku: 'COFFEE-FLATWHITE',
      prepTimeMinutes: 3,
      kitchenStation: 'bar',
      isActive: true,
      sortOrder: 1,
    },
  });

  const icedMatcha = await prisma.product.upsert({
    where: {
      products_tenant_name_category_unique: {
        tenantId: tenant.id,
        name: 'Iced Matcha',
        categoryId: categories[0].id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: categories[0].id,
      name: 'Iced Matcha',
      displayName: 'Iced Matcha',
      shortName: 'Matcha',
      description: 'Premium iced matcha latte',
      basePrice: 5.5,
      costPrice: 1.5,
      taxRate: 0.08,
      sku: 'COFFEE-MATCHA',
      prepTimeMinutes: 2,
      kitchenStation: 'bar',
      isActive: true,
      sortOrder: 2,
    },
  });

  const coldBrew = await prisma.product.upsert({
    where: {
      products_tenant_name_category_unique: {
        tenantId: tenant.id,
        name: 'Cold Brew',
        categoryId: categories[0].id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: categories[0].id,
      name: 'Cold Brew',
      displayName: 'Cold Brew',
      shortName: 'Cold Brew',
      description: 'Smooth cold-brewed coffee',
      basePrice: 5.0,
      costPrice: 1.1,
      taxRate: 0.08,
      sku: 'COFFEE-COLDBREW',
      prepTimeMinutes: 1,
      kitchenStation: 'bar',
      isActive: true,
      sortOrder: 3,
    },
  });

  // Additional coffee products to reach 10
  const espresso = await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Espresso', categoryId: categories[0].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[0].id, name: 'Espresso', displayName: 'Espresso', shortName: 'Espresso', description: 'Double shot espresso', basePrice: 3.5, costPrice: 0.8, sku: 'COFFEE-ESPRESSO', prepTimeMinutes: 2, kitchenStation: 'bar', isActive: true, sortOrder: 4 },
  });

  const cappuccino = await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Cappuccino', categoryId: categories[0].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[0].id, name: 'Cappuccino', displayName: 'Cappuccino', shortName: 'Cappuccino', description: 'Espresso with steamed milk foam', basePrice: 4.75, costPrice: 1.1, sku: 'COFFEE-CAPPUCCINO', prepTimeMinutes: 3, kitchenStation: 'bar', isActive: true, sortOrder: 5 },
  });

  const latte = await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Caffe Latte', categoryId: categories[0].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[0].id, name: 'Caffe Latte', displayName: 'Caffe Latte', shortName: 'Latte', description: 'Espresso with steamed milk', basePrice: 4.5, costPrice: 1.0, sku: 'COFFEE-LATTE', prepTimeMinutes: 3, kitchenStation: 'bar', isActive: true, sortOrder: 6 },
  });

  const americano = await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Americano', categoryId: categories[0].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[0].id, name: 'Americano', displayName: 'Americano', shortName: 'Americano', description: 'Espresso with hot water', basePrice: 4.0, costPrice: 0.9, sku: 'COFFEE-AMERICANO', prepTimeMinutes: 2, kitchenStation: 'bar', isActive: true, sortOrder: 7 },
  });

  const mocha = await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Mocha', categoryId: categories[0].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[0].id, name: 'Mocha', displayName: 'Mocha', shortName: 'Mocha', description: 'Espresso with chocolate and steamed milk', basePrice: 5.25, costPrice: 1.3, sku: 'COFFEE-MOCHA', prepTimeMinutes: 4, kitchenStation: 'bar', isActive: true, sortOrder: 8 },
  });

  const caramelMacchiato = await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Caramel Macchiato', categoryId: categories[0].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[0].id, name: 'Caramel Macchiato', displayName: 'Caramel Macchiato', shortName: 'Macchiato', description: 'Vanilla, milk, espresso, caramel', basePrice: 5.5, costPrice: 1.4, sku: 'COFFEE-MACCHIATO', prepTimeMinutes: 4, kitchenStation: 'bar', isActive: true, sortOrder: 9 },
  });

  const hotChocolate = await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Hot Chocolate', categoryId: categories[0].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[0].id, name: 'Hot Chocolate', displayName: 'Hot Chocolate', shortName: 'Hot Choc', description: 'Rich hot chocolate with whipped cream', basePrice: 4.5, costPrice: 1.0, sku: 'COFFEE-HOTCHOC', prepTimeMinutes: 3, kitchenStation: 'bar', isActive: true, sortOrder: 10 },
  });

  // Pastries category products
  const butterCroissant = await prisma.product.upsert({
    where: {
      products_tenant_name_category_unique: {
        tenantId: tenant.id,
        name: 'Butter Croissant',
        categoryId: categories[1].id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: categories[1].id,
      name: 'Butter Croissant',
      displayName: 'Butter Croissant',
      shortName: 'Croissant',
      description: 'Flaky butter croissant',
      basePrice: 3.75,
      costPrice: 0.9,
      taxRate: 0.08,
      sku: 'PASTRY-CROISSANT',
      prepTimeMinutes: 1,
      kitchenStation: 'pastry',
      trackInventory: true,
      currentStock: 48,
      lowStockThreshold: 10,
      isActive: true,
      sortOrder: 1,
    },
  });

  const berryMuffin = await prisma.product.upsert({
    where: {
      products_tenant_name_category_unique: {
        tenantId: tenant.id,
        name: 'Berry Muffin',
        categoryId: categories[1].id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: categories[1].id,
      name: 'Berry Muffin',
      displayName: 'Berry Muffin',
      shortName: 'Muffin',
      description: 'Mixed berry muffin',
      basePrice: 4.25,
      costPrice: 1.0,
      taxRate: 0.08,
      sku: 'PASTRY-MUFFIN',
      prepTimeMinutes: 1,
      kitchenStation: 'pastry',
      trackInventory: true,
      currentStock: 36,
      lowStockThreshold: 8,
      isActive: true,
      sortOrder: 2,
    },
  });

  const plainBagel = await prisma.product.upsert({
    where: {
      products_tenant_name_category_unique: {
        tenantId: tenant.id,
        name: 'Plain Bagel',
        categoryId: categories[1].id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: categories[1].id,
      name: 'Plain Bagel',
      displayName: 'Plain Bagel',
      shortName: 'Bagel',
      description: 'Classic plain bagel',
      basePrice: 3.5,
      costPrice: 0.7,
      taxRate: 0.08,
      sku: 'PASTRY-BAGEL',
      prepTimeMinutes: 2,
      kitchenStation: 'pastry',
      trackInventory: true,
      currentStock: 42,
      lowStockThreshold: 12,
      isActive: true,
      sortOrder: 3,
    },
  });

  // Additional pastries to reach count of 12 shown in screenshot
  const chocolateCroissant = await prisma.product.upsert({
    where: {
      products_tenant_name_category_unique: {
        tenantId: tenant.id,
        name: 'Chocolate Croissant',
        categoryId: categories[1].id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: categories[1].id,
      name: 'Chocolate Croissant',
      displayName: 'Chocolate Croissant',
      shortName: 'Choc Croiss',
      description: 'Croissant with chocolate filling',
      basePrice: 4.25,
      costPrice: 1.1,
      taxRate: 0.08,
      sku: 'PASTRY-CHOCCROISS',
      prepTimeMinutes: 1,
      kitchenStation: 'pastry',
      trackInventory: true,
      currentStock: 30,
      lowStockThreshold: 8,
      isActive: true,
      sortOrder: 4,
    },
  });

  const bananaBread = await prisma.product.upsert({
    where: {
      products_tenant_name_category_unique: {
        tenantId: tenant.id,
        name: 'Banana Bread',
        categoryId: categories[1].id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: categories[1].id,
      name: 'Banana Bread',
      displayName: 'Banana Bread',
      shortName: 'Banana',
      description: 'Homemade banana bread',
      basePrice: 3.95,
      costPrice: 0.95,
      taxRate: 0.08,
      sku: 'PASTRY-BANANA',
      prepTimeMinutes: 1,
      kitchenStation: 'pastry',
      trackInventory: true,
      currentStock: 24,
      lowStockThreshold: 6,
      isActive: true,
      sortOrder: 5,
    },
  });

  const scone = await prisma.product.upsert({
    where: {
      products_tenant_name_category_unique: {
        tenantId: tenant.id,
        name: 'Scone',
        categoryId: categories[1].id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: categories[1].id,
      name: 'Scone',
      displayName: 'Blueberry Scone',
      shortName: 'Scone',
      description: 'Fresh blueberry scone',
      basePrice: 3.5,
      costPrice: 0.85,
      taxRate: 0.08,
      sku: 'PASTRY-SCONE',
      prepTimeMinutes: 1,
      kitchenStation: 'pastry',
      trackInventory: true,
      currentStock: 32,
      lowStockThreshold: 8,
      isActive: true,
      sortOrder: 6,
    },
  });

  const cinnamonRoll = await prisma.product.upsert({
    where: {
      products_tenant_name_category_unique: {
        tenantId: tenant.id,
        name: 'Cinnamon Roll',
        categoryId: categories[1].id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: categories[1].id,
      name: 'Cinnamon Roll',
      displayName: 'Cinnamon Roll',
      shortName: 'Cinn Roll',
      description: 'Warm cinnamon roll with icing',
      basePrice: 4.5,
      costPrice: 1.05,
      taxRate: 0.08,
      sku: 'PASTRY-CINNROLL',
      prepTimeMinutes: 2,
      kitchenStation: 'pastry',
      trackInventory: true,
      currentStock: 28,
      lowStockThreshold: 6,
      isActive: true,
      sortOrder: 7,
    },
  });

  const danishPastry = await prisma.product.upsert({
    where: {
      products_tenant_name_category_unique: {
        tenantId: tenant.id,
        name: 'Danish Pastry',
        categoryId: categories[1].id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: categories[1].id,
      name: 'Danish Pastry',
      displayName: 'Cheese Danish',
      shortName: 'Danish',
      description: 'Flaky danish with cream cheese',
      basePrice: 4.0,
      costPrice: 0.95,
      taxRate: 0.08,
      sku: 'PASTRY-DANISH',
      prepTimeMinutes: 1,
      kitchenStation: 'pastry',
      trackInventory: true,
      currentStock: 26,
      lowStockThreshold: 6,
      isActive: true,
      sortOrder: 8,
    },
  });

  // Two more pastries to reach 10
  await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Almond Cookie', categoryId: categories[1].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[1].id, name: 'Almond Cookie', displayName: 'Almond Cookie', shortName: 'Cookie', description: 'Crispy almond butter cookie', basePrice: 3.25, costPrice: 0.75, sku: 'PASTRY-COOKIE', prepTimeMinutes: 1, kitchenStation: 'pastry', trackInventory: true, currentStock: 40, lowStockThreshold: 10, isActive: true, sortOrder: 9 },
  });

  await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Brownie Bite', categoryId: categories[1].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[1].id, name: 'Brownie Bite', displayName: 'Brownie Bite', shortName: 'Brownie', description: 'Rich chocolate brownie square', basePrice: 3.75, costPrice: 0.85, sku: 'PASTRY-BROWNIE', prepTimeMinutes: 1, kitchenStation: 'pastry', trackInventory: true, currentStock: 36, lowStockThreshold: 10, isActive: true, sortOrder: 10 },
  });

  console.log('✅ Created 10 pastry products');

  // Sandwiches category product
  const avocadoToast = await prisma.product.upsert({
    where: {
      products_tenant_name_category_unique: {
        tenantId: tenant.id,
        name: 'Avocado Toast',
        categoryId: categories[2].id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: categories[2].id,
      name: 'Avocado Toast',
      displayName: 'Avocado Toast',
      shortName: 'Avo Toast',
      description: 'Smashed avocado on sourdough',
      basePrice: 14.5,
      costPrice: 4.2,
      taxRate: 0.08,
      sku: 'SANDWICH-AVOTOAST',
      prepTimeMinutes: 5,
      kitchenStation: 'kitchen',
      isActive: true,
      sortOrder: 1,
    },
  });

  // Additional sandwiches to reach 10
  await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Club Sandwich', categoryId: categories[2].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[2].id, name: 'Club Sandwich', displayName: 'Club Sandwich', shortName: 'Club', description: 'Triple-decker with turkey, bacon, lettuce, tomato', basePrice: 16.5, costPrice: 5.0, sku: 'SANDWICH-CLUB', prepTimeMinutes: 7, kitchenStation: 'kitchen', isActive: true, sortOrder: 2 },
  });

  await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'BLT Sandwich', categoryId: categories[2].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[2].id, name: 'BLT Sandwich', displayName: 'BLT Sandwich', shortName: 'BLT', description: 'Bacon, lettuce, tomato on toasted bread', basePrice: 12.5, costPrice: 3.5, sku: 'SANDWICH-BLT', prepTimeMinutes: 5, kitchenStation: 'kitchen', isActive: true, sortOrder: 3 },
  });

  await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Grilled Cheese', categoryId: categories[2].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[2].id, name: 'Grilled Cheese', displayName: 'Grilled Cheese', shortName: 'Grilled', description: 'Classic grilled cheese sandwich', basePrice: 9.5, costPrice: 2.0, sku: 'SANDWICH-GRILLED', prepTimeMinutes: 4, kitchenStation: 'kitchen', isActive: true, sortOrder: 4 },
  });

  await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Turkey Wrap', categoryId: categories[2].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[2].id, name: 'Turkey Wrap', displayName: 'Turkey Wrap', shortName: 'Turkey', description: 'Sliced turkey with greens in a wrap', basePrice: 13.5, costPrice: 4.0, sku: 'SANDWICH-TURKEY', prepTimeMinutes: 5, kitchenStation: 'kitchen', isActive: true, sortOrder: 5 },
  });

  await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Tuna Melt', categoryId: categories[2].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[2].id, name: 'Tuna Melt', displayName: 'Tuna Melt', shortName: 'Tuna', description: 'Tuna salad with melted cheese', basePrice: 14.0, costPrice: 4.2, sku: 'SANDWICH-TUNA', prepTimeMinutes: 6, kitchenStation: 'kitchen', isActive: true, sortOrder: 6 },
  });

  await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Veggie Panini', categoryId: categories[2].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[2].id, name: 'Veggie Panini', displayName: 'Veggie Panini', shortName: 'Veggie', description: 'Grilled vegetables with pesto', basePrice: 13.0, costPrice: 3.5, sku: 'SANDWICH-VEGGIE', prepTimeMinutes: 6, kitchenStation: 'kitchen', isActive: true, sortOrder: 7 },
  });

  await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Ham & Cheese', categoryId: categories[2].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[2].id, name: 'Ham & Cheese', displayName: 'Ham & Cheese', shortName: 'Ham', description: 'Classic ham and swiss cheese', basePrice: 11.5, costPrice: 3.0, sku: 'SANDWICH-HAM', prepTimeMinutes: 4, kitchenStation: 'kitchen', isActive: true, sortOrder: 8 },
  });

  await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Caprese Sandwich', categoryId: categories[2].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[2].id, name: 'Caprese Sandwich', displayName: 'Caprese Sandwich', shortName: 'Caprese', description: 'Fresh mozzarella, tomato, basil', basePrice: 12.5, costPrice: 3.8, sku: 'SANDWICH-CAPRESE', prepTimeMinutes: 4, kitchenStation: 'kitchen', isActive: true, sortOrder: 9 },
  });

  await prisma.product.upsert({
    where: { products_tenant_name_category_unique: { tenantId: tenant.id, name: 'Egg Salad Sandwich', categoryId: categories[2].id } },
    update: {},
    create: { tenantId: tenant.id, categoryId: categories[2].id, name: 'Egg Salad Sandwich', displayName: 'Egg Salad', shortName: 'Egg', description: 'Creamy egg salad on wheat bread', basePrice: 10.5, costPrice: 2.5, sku: 'SANDWICH-EGG', prepTimeMinutes: 3, kitchenStation: 'kitchen', isActive: true, sortOrder: 10 },
  });

  console.log('✅ Created 10 sandwich products');

  const products = [
    flatWhite, icedMatcha, coldBrew,
    butterCroissant, berryMuffin, plainBagel, chocolateCroissant,
    bananaBread, scone, cinnamonRoll, danishPastry,
    avocadoToast
  ];
  console.log('✅ Created products:', products.length);

  // Link modifiers to coffee products (using upsert)
  // Flat White
  await prisma.productModifierGroup.upsert({
    where: {
      product_modifier_groups_unique: {
        productId: flatWhite.id,
        modifierGroupId: sizeGroup.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      productId: flatWhite.id,
      modifierGroupId: sizeGroup.id,
      isRequired: true,
      sortOrder: 1,
    },
  });

  await prisma.productModifierGroup.upsert({
    where: {
      product_modifier_groups_unique: {
        productId: flatWhite.id,
        modifierGroupId: milkGroup.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      productId: flatWhite.id,
      modifierGroupId: milkGroup.id,
      isRequired: false,
      sortOrder: 2,
    },
  });

  // Iced Matcha
  await prisma.productModifierGroup.upsert({
    where: {
      product_modifier_groups_unique: {
        productId: icedMatcha.id,
        modifierGroupId: sizeGroup.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      productId: icedMatcha.id,
      modifierGroupId: sizeGroup.id,
      isRequired: true,
      sortOrder: 1,
    },
  });

  await prisma.productModifierGroup.upsert({
    where: {
      product_modifier_groups_unique: {
        productId: icedMatcha.id,
        modifierGroupId: milkGroup.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      productId: icedMatcha.id,
      modifierGroupId: milkGroup.id,
      isRequired: false,
      sortOrder: 2,
    },
  });

  // Cold Brew
  await prisma.productModifierGroup.upsert({
    where: {
      product_modifier_groups_unique: {
        productId: coldBrew.id,
        modifierGroupId: sizeGroup.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      productId: coldBrew.id,
      modifierGroupId: sizeGroup.id,
      isRequired: true,
      sortOrder: 1,
    },
  });

  // Espresso - size only
  await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: espresso.id, modifierGroupId: sizeGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: espresso.id, modifierGroupId: sizeGroup.id, isRequired: true, sortOrder: 1 } });

  // Cappuccino - size and milk
  await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: cappuccino.id, modifierGroupId: sizeGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: cappuccino.id, modifierGroupId: sizeGroup.id, isRequired: true, sortOrder: 1 } });
  await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: cappuccino.id, modifierGroupId: milkGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: cappuccino.id, modifierGroupId: milkGroup.id, isRequired: false, sortOrder: 2 } });

  // Latte - size and milk
  await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: latte.id, modifierGroupId: sizeGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: latte.id, modifierGroupId: sizeGroup.id, isRequired: true, sortOrder: 1 } });
  await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: latte.id, modifierGroupId: milkGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: latte.id, modifierGroupId: milkGroup.id, isRequired: false, sortOrder: 2 } });

  // Americano - size only
  await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: americano.id, modifierGroupId: sizeGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: americano.id, modifierGroupId: sizeGroup.id, isRequired: true, sortOrder: 1 } });

  // Mocha - size and milk
  await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: mocha.id, modifierGroupId: sizeGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: mocha.id, modifierGroupId: sizeGroup.id, isRequired: true, sortOrder: 1 } });
  await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: mocha.id, modifierGroupId: milkGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: mocha.id, modifierGroupId: milkGroup.id, isRequired: false, sortOrder: 2 } });

  // Caramel Macchiato - size and milk
  await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: caramelMacchiato.id, modifierGroupId: sizeGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: caramelMacchiato.id, modifierGroupId: sizeGroup.id, isRequired: true, sortOrder: 1 } });
  await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: caramelMacchiato.id, modifierGroupId: milkGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: caramelMacchiato.id, modifierGroupId: milkGroup.id, isRequired: false, sortOrder: 2 } });

  // Hot Chocolate - size only (no milk option, already has milk)
  await prisma.productModifierGroup.upsert({ where: { product_modifier_groups_unique: { productId: hotChocolate.id, modifierGroupId: sizeGroup.id } }, update: {}, create: { tenantId: tenant.id, productId: hotChocolate.id, modifierGroupId: sizeGroup.id, isRequired: true, sortOrder: 1 } });

  console.log('✅ Linked modifiers to coffee products (10 coffees, 8 with modifiers)');

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

  // Create a terminal (using upsert)
  const terminal = await prisma.terminal.upsert({
    where: {
      deviceId: 'TERM-001-DEMO',
    },
    update: {},
    create: {
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
  console.log(`- Products: ${products.length}`);
  console.log(`- Customer: ${customer.email}`);
  console.log('');
  console.log('🚀 You can now start using the POS system!');
  console.log('📝 Login: EMP-001 / PIN: 1234');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
