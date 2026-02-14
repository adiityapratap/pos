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

  console.log('✅ Linked modifiers to coffee products');

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
