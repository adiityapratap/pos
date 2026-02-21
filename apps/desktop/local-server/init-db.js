/**
 * BIZPOS Local Database - SQLite Schema
 * Simplified schema for offline POS operations
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Get database path - uses user's app data folder for persistence
function getDbPath() {
  const appDataPath = process.env.APPDATA || 
    (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library', 'Application Support') : '/var/local');
  const bizposPath = path.join(appDataPath, 'BIZPOS');
  
  if (!fs.existsSync(bizposPath)) {
    fs.mkdirSync(bizposPath, { recursive: true });
  }
  
  return path.join(bizposPath, 'bizpos.db');
}

function initDatabase() {
  const dbPath = getDbPath();
  console.log('Database path:', dbPath);
  
  const db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables
  db.exec(`
    -- Settings table for app configuration
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
    
    -- Users table for local authentication
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      pin_code TEXT,
      first_name TEXT,
      last_name TEXT,
      role TEXT DEFAULT 'cashier',
      is_active INTEGER DEFAULT 1,
      last_login_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    
    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      color_hex TEXT DEFAULT '#4F46E5',
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    
    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      category_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      sku TEXT,
      price REAL NOT NULL DEFAULT 0,
      cost_price REAL DEFAULT 0,
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      is_available INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
    
    -- Modifier Groups (e.g., "Size", "Add-ons", "Toppings")
    CREATE TABLE IF NOT EXISTS modifier_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      min_selections INTEGER DEFAULT 0,
      max_selections INTEGER DEFAULT 1,
      is_required INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    
    -- Modifiers (e.g., "Small", "Medium", "Large", "Extra Cheese")
    CREATE TABLE IF NOT EXISTS modifiers (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price_adjustment REAL DEFAULT 0,
      is_default INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (group_id) REFERENCES modifier_groups(id) ON DELETE CASCADE
    );
    
    -- Product-ModifierGroup junction table
    CREATE TABLE IF NOT EXISTS product_modifier_groups (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      modifier_group_id TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (modifier_group_id) REFERENCES modifier_groups(id) ON DELETE CASCADE,
      UNIQUE(product_id, modifier_group_id)
    );
    
    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      order_type TEXT DEFAULT 'dine_in',
      subtotal REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      payment_method TEXT,
      payment_status TEXT DEFAULT 'unpaid',
      notes TEXT,
      customer_name TEXT,
      table_number TEXT,
      cashier_id TEXT,
      terminal_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      voided_at TEXT,
      voided_by TEXT,
      void_reason TEXT,
      sync_status TEXT DEFAULT 'pending',
      synced_at TEXT,
      FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL
    );
    
    -- Order Items table
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );
    
    -- Order Item Modifiers
    CREATE TABLE IF NOT EXISTS order_item_modifiers (
      id TEXT PRIMARY KEY,
      order_item_id TEXT NOT NULL,
      modifier_id TEXT,
      modifier_name TEXT NOT NULL,
      price_adjustment REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
      FOREIGN KEY (modifier_id) REFERENCES modifiers(id) ON DELETE SET NULL
    );
    
    -- Daily Sales Summary (for quick reporting)
    CREATE TABLE IF NOT EXISTS daily_sales (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      total_orders INTEGER DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      total_tax REAL DEFAULT 0,
      total_discounts REAL DEFAULT 0,
      cash_sales REAL DEFAULT 0,
      card_sales REAL DEFAULT 0,
      other_sales REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    
    -- Sync Queue (for offline-first sync)
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL,
      data TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      synced_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      last_error TEXT
    );
    
    -- Config table for cloud sync settings
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
    
    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_sync ON orders(sync_status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_modifiers_group ON modifiers(group_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(sync_status);
  `);
  
  console.log('Database schema created successfully!');
  
  // Check if we need to seed data
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  
  if (userCount.count === 0) {
    console.log('Seeding initial data...');
    seedData(db);
  }
  
  db.close();
  console.log('Database initialization complete!');
}

function seedData(db) {
  // Create default admin user (PIN: 1234)
  const adminId = uuidv4();
  const passwordHash = bcrypt.hashSync('admin123', 10);
  
  db.prepare(`
    INSERT INTO users (id, email, password_hash, pin_code, first_name, last_name, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(adminId, 'admin@bizpos.local', passwordHash, '1234', 'Admin', 'User', 'admin');
  
  // Create sample cashier (PIN: 0000)
  const cashierId = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, pin_code, first_name, last_name, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(cashierId, 'cashier@bizpos.local', bcrypt.hashSync('cashier123', 10), '0000', 'John', 'Cashier', 'cashier');
  
  // Create sample categories
  const categories = [
    { id: uuidv4(), name: 'Coffee', color: '#8B4513', sort: 1 },
    { id: uuidv4(), name: 'Tea', color: '#228B22', sort: 2 },
    { id: uuidv4(), name: 'Pastries', color: '#DAA520', sort: 3 },
    { id: uuidv4(), name: 'Sandwiches', color: '#CD853F', sort: 4 },
    { id: uuidv4(), name: 'Cold Drinks', color: '#4169E1', sort: 5 },
  ];
  
  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, color_hex, sort_order)
    VALUES (?, ?, ?, ?)
  `);
  
  categories.forEach(cat => {
    insertCategory.run(cat.id, cat.name, cat.color, cat.sort);
  });
  
  // Create sample products
  const products = [
    // Coffee
    { name: 'Espresso', price: 2.50, category: categories[0].id },
    { name: 'Americano', price: 3.00, category: categories[0].id },
    { name: 'Latte', price: 4.00, category: categories[0].id },
    { name: 'Cappuccino', price: 4.00, category: categories[0].id },
    { name: 'Mocha', price: 4.50, category: categories[0].id },
    { name: 'Flat White', price: 4.00, category: categories[0].id },
    // Tea
    { name: 'Green Tea', price: 2.50, category: categories[1].id },
    { name: 'Black Tea', price: 2.50, category: categories[1].id },
    { name: 'Chai Latte', price: 4.00, category: categories[1].id },
    { name: 'Matcha Latte', price: 4.50, category: categories[1].id },
    // Pastries
    { name: 'Croissant', price: 3.00, category: categories[2].id },
    { name: 'Chocolate Muffin', price: 3.50, category: categories[2].id },
    { name: 'Blueberry Muffin', price: 3.50, category: categories[2].id },
    { name: 'Cinnamon Roll', price: 4.00, category: categories[2].id },
    { name: 'Banana Bread', price: 3.00, category: categories[2].id },
    // Sandwiches
    { name: 'Ham & Cheese', price: 6.50, category: categories[3].id },
    { name: 'Turkey Club', price: 7.50, category: categories[3].id },
    { name: 'Veggie Wrap', price: 6.00, category: categories[3].id },
    { name: 'Grilled Cheese', price: 5.50, category: categories[3].id },
    // Cold Drinks
    { name: 'Iced Coffee', price: 3.50, category: categories[4].id },
    { name: 'Iced Latte', price: 4.50, category: categories[4].id },
    { name: 'Lemonade', price: 3.00, category: categories[4].id },
    { name: 'Smoothie', price: 5.00, category: categories[4].id },
  ];
  
  const insertProduct = db.prepare(`
    INSERT INTO products (id, category_id, name, price, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  products.forEach((prod, index) => {
    insertProduct.run(uuidv4(), prod.category, prod.name, prod.price, index);
  });
  
  // Create modifier groups
  const sizeGroupId = uuidv4();
  const milkGroupId = uuidv4();
  const extrasGroupId = uuidv4();
  
  db.prepare(`
    INSERT INTO modifier_groups (id, name, min_selections, max_selections, is_required, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(sizeGroupId, 'Size', 1, 1, 1, 1);
  
  db.prepare(`
    INSERT INTO modifier_groups (id, name, min_selections, max_selections, is_required, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(milkGroupId, 'Milk Options', 0, 1, 0, 2);
  
  db.prepare(`
    INSERT INTO modifier_groups (id, name, min_selections, max_selections, is_required, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(extrasGroupId, 'Extras', 0, 5, 0, 3);
  
  // Create modifiers
  const insertModifier = db.prepare(`
    INSERT INTO modifiers (id, group_id, name, price_adjustment, is_default, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  // Size modifiers
  insertModifier.run(uuidv4(), sizeGroupId, 'Small', 0, 1, 1);
  insertModifier.run(uuidv4(), sizeGroupId, 'Medium', 0.50, 0, 2);
  insertModifier.run(uuidv4(), sizeGroupId, 'Large', 1.00, 0, 3);
  
  // Milk modifiers
  insertModifier.run(uuidv4(), milkGroupId, 'Regular Milk', 0, 1, 1);
  insertModifier.run(uuidv4(), milkGroupId, 'Oat Milk', 0.50, 0, 2);
  insertModifier.run(uuidv4(), milkGroupId, 'Almond Milk', 0.50, 0, 3);
  insertModifier.run(uuidv4(), milkGroupId, 'Soy Milk', 0.50, 0, 4);
  
  // Extra modifiers
  insertModifier.run(uuidv4(), extrasGroupId, 'Extra Shot', 0.75, 0, 1);
  insertModifier.run(uuidv4(), extrasGroupId, 'Whipped Cream', 0.50, 0, 2);
  insertModifier.run(uuidv4(), extrasGroupId, 'Caramel Drizzle', 0.50, 0, 3);
  insertModifier.run(uuidv4(), extrasGroupId, 'Vanilla Syrup', 0.50, 0, 4);
  
  // Link modifier groups to coffee products
  const coffeeCategory = categories[0].id;
  const coffeeProducts = db.prepare('SELECT id FROM products WHERE category_id = ?').all(coffeeCategory);
  
  const linkModifierGroup = db.prepare(`
    INSERT INTO product_modifier_groups (id, product_id, modifier_group_id, sort_order)
    VALUES (?, ?, ?, ?)
  `);
  
  coffeeProducts.forEach(prod => {
    linkModifierGroup.run(uuidv4(), prod.id, sizeGroupId, 1);
    linkModifierGroup.run(uuidv4(), prod.id, milkGroupId, 2);
    linkModifierGroup.run(uuidv4(), prod.id, extrasGroupId, 3);
  });
  
  // Set initial settings
  const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('store_name', 'My Coffee Shop');
  insertSetting.run('tax_rate', '0.08');
  insertSetting.run('currency', 'USD');
  insertSetting.run('server_mode', 'standalone');
  insertSetting.run('last_order_number', '0');
  
  console.log('Sample data seeded successfully!');
}

// Run initialization
initDatabase();
