/**
 * BIZPOS Local Server - Express API
 * Runs embedded in Electron for offline POS functionality
 */

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Get database path
function getDbPath() {
  const appDataPath = process.env.APPDATA || 
    (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library', 'Application Support') : '/var/local');
  const bizposPath = path.join(appDataPath, 'BIZPOS');
  return path.join(bizposPath, 'bizpos.db');
}

// Database connection
let db;
function getDb() {
  if (!db) {
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath)) {
      console.error('Database not found. Please run init-db.js first.');
      process.exit(1);
    }
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
  }
  return db;
}

// Get local IP addresses for server discovery
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

// ========================================
// AUTH ROUTES
// ========================================

// Login with email/password
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDb();
    
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    db.prepare('UPDATE users SET last_login_at = datetime("now") WHERE id = ?').run(user.id);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      token: `local_${user.id}_${Date.now()}`, // Simple local token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Login with PIN
app.post('/api/auth/pin-login', (req, res) => {
  try {
    const { pin } = req.body;
    const db = getDb();
    
    const user = db.prepare('SELECT * FROM users WHERE pin_code = ? AND is_active = 1').get(pin);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }
    
    // Update last login
    db.prepare('UPDATE users SET last_login_at = datetime("now") WHERE id = ?').run(user.id);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      token: `local_${user.id}_${Date.now()}`,
    });
  } catch (error) {
    console.error('PIN login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || !token.startsWith('local_')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = token.split('_')[1];
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Auth check failed' });
  }
});

// ========================================
// CATEGORIES ROUTES
// ========================================

app.get('/api/categories', (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare(`
      SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order
    `).all();
    
    res.json(categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      displayName: cat.name, // POS terminal uses displayName
      description: cat.description,
      sortOrder: cat.sort_order,
      colorHex: cat.color_hex,
      imageUrl: cat.image_url,
      isActive: cat.is_active === 1,
    })));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

app.post('/api/categories', (req, res) => {
  try {
    const { name, description, colorHex, sortOrder } = req.body;
    const db = getDb();
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO categories (id, name, description, color_hex, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, description || null, colorHex || '#4F46E5', sortOrder || 0);
    
    res.json({ id, name, description, colorHex, sortOrder });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// ========================================
// PRODUCTS ROUTES
// ========================================

app.get('/api/products', (req, res) => {
  try {
    const { categoryId } = req.query;
    const db = getDb();
    
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = 1
    `;
    const params = [];
    
    if (categoryId) {
      query += ' AND p.category_id = ?';
      params.push(categoryId);
    }
    
    query += ' ORDER BY p.sort_order';
    
    const products = db.prepare(query).all(...params);
    
    // Return in format POS terminal expects
    res.json(products.map(prod => ({
      id: prod.id,
      categoryId: prod.category_id,
      categoryName: prod.category_name,
      name: prod.name,
      displayName: prod.name, // POS terminal uses displayName
      description: prod.description,
      sku: prod.sku,
      price: prod.price,
      basePrice: prod.price, // POS terminal uses basePrice
      costPrice: prod.cost_price,
      imageUrl: prod.image_url,
      isActive: prod.is_active === 1,
      isAvailable: prod.is_available === 1,
      sortOrder: prod.sort_order,
    })));
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const { categoryId, name, description, sku, price, costPrice, imageUrl, sortOrder } = req.body;
    const db = getDb();
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO products (id, category_id, name, description, sku, price, cost_price, image_url, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, categoryId || null, name, description || null, sku || null, price || 0, costPrice || 0, imageUrl || null, sortOrder || 0);
    
    res.json({ id, categoryId, name, description, sku, price, costPrice, imageUrl, sortOrder });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Get product with modifiers
app.get('/api/products/:id/modifiers', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    
    const modifierGroups = db.prepare(`
      SELECT mg.* FROM modifier_groups mg
      INNER JOIN product_modifier_groups pmg ON mg.id = pmg.modifier_group_id
      WHERE pmg.product_id = ? AND mg.is_active = 1
      ORDER BY pmg.sort_order
    `).all(id);
    
    const result = modifierGroups.map(group => {
      const modifiers = db.prepare(`
        SELECT * FROM modifiers WHERE group_id = ? AND is_active = 1 ORDER BY sort_order
      `).all(group.id);
      
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        minSelections: group.min_selections,
        maxSelections: group.max_selections,
        isRequired: group.is_required === 1,
        modifiers: modifiers.map(mod => ({
          id: mod.id,
          name: mod.name,
          priceAdjustment: mod.price_adjustment,
          isDefault: mod.is_default === 1,
        })),
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Get product modifiers error:', error);
    res.status(500).json({ error: 'Failed to get modifiers' });
  }
});

// ========================================
// MODIFIER ROUTES
// ========================================

app.get('/api/modifier-groups', (req, res) => {
  try {
    const db = getDb();
    const groups = db.prepare('SELECT * FROM modifier_groups WHERE is_active = 1 ORDER BY sort_order').all();
    
    const result = groups.map(group => {
      const modifiers = db.prepare('SELECT * FROM modifiers WHERE group_id = ? AND is_active = 1 ORDER BY sort_order').all(group.id);
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        minSelections: group.min_selections,
        maxSelections: group.max_selections,
        isRequired: group.is_required === 1,
        modifiers: modifiers.map(mod => ({
          id: mod.id,
          name: mod.name,
          priceAdjustment: mod.price_adjustment,
          isDefault: mod.is_default === 1,
        })),
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Get modifier groups error:', error);
    res.status(500).json({ error: 'Failed to get modifier groups' });
  }
});

// ========================================
// LOCATIONS ROUTES
// ========================================

app.get('/api/locations', (req, res) => {
  try {
    // For local mode, return a single default location
    res.json([{
      id: 'local-location-001',
      name: 'Main Location',
      code: 'MAIN',
      locationType: 'restaurant',
      isActive: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currencyCode: 'USD',
    }]);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to get locations' });
  }
});

// ========================================
// SUBCATEGORIES ROUTES
// ========================================

app.get('/api/subcategories', (req, res) => {
  try {
    // For simplified local mode, we don't use subcategories
    res.json([]);
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ error: 'Failed to get subcategories' });
  }
});

// ========================================
// COMBOS ROUTES
// ========================================

app.get('/api/combos', (req, res) => {
  try {
    // Return empty combos for now - can be expanded later
    res.json([]);
  } catch (error) {
    console.error('Get combos error:', error);
    res.status(500).json({ error: 'Failed to get combos' });
  }
});

// ========================================
// ORDERS ROUTES
// ========================================

// Get next order number
function getNextOrderNumber(db) {
  const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('last_order_number');
  const nextNumber = parseInt(setting?.value || '0') + 1;
  db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(nextNumber.toString(), 'last_order_number');
  return nextNumber;
}

// Get all orders
app.get('/api/orders', (req, res) => {
  try {
    const { status, date, limit = 50 } = req.query;
    const db = getDb();
    
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (date) {
      query += ' AND date(created_at) = ?';
      params.push(date);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const orders = db.prepare(query).all(...params);
    
    // Get items for each order
    const result = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        orderType: order.order_type,
        subtotal: order.subtotal,
        taxAmount: order.tax_amount,
        discountAmount: order.discount_amount,
        totalAmount: order.total_amount,
        paidAmount: order.paid_amount,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        notes: order.notes,
        customerName: order.customer_name,
        tableNumber: order.table_number,
        createdAt: order.created_at,
        completedAt: order.completed_at,
        items: items.map(item => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          subtotal: item.subtotal,
          notes: item.notes,
        })),
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Create new order
app.post('/api/orders', (req, res) => {
  try {
    const { 
      orderType = 'dine_in',
      items,
      notes,
      customerName,
      tableNumber,
      cashierId,
      paymentMethod,
      locationId,
      discountAmount = 0,
      taxRate: requestTaxRate,
    } = req.body;
    
    const db = getDb();
    const orderId = uuidv4();
    const orderNumber = getNextOrderNumber(db);
    
    // Get tax rate from settings or request
    const taxRateSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('tax_rate');
    const taxRate = requestTaxRate || parseFloat(taxRateSetting?.value || '0.08');
    
    // Calculate totals - handle both payload formats
    let subtotal = 0;
    items.forEach(item => {
      // Support both 'unitPrice' and lineTotal
      const itemPrice = item.unitPrice || item.lineTotal / (item.quantity || 1);
      const quantity = item.quantity || 1;
      subtotal += itemPrice * quantity;
    });
    
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount - (discountAmount || 0);
    
    // Determine payment status
    const paidAmount = paymentMethod ? totalAmount : 0;
    const paymentStatus = paymentMethod ? 'paid' : 'unpaid';
    const status = paymentMethod ? 'completed' : 'pending';
    
    // Insert order
    db.prepare(`
      INSERT INTO orders (
        id, order_number, status, order_type, subtotal, tax_amount, discount_amount,
        total_amount, paid_amount, payment_method, payment_status,
        notes, customer_name, table_number, cashier_id, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId, orderNumber, status, orderType, subtotal, taxAmount, discountAmount || 0,
      totalAmount, paidAmount, paymentMethod || null, paymentStatus,
      notes || null, customerName || null, tableNumber || null, cashierId || null,
      paymentMethod ? new Date().toISOString() : null
    );
    
    // Insert order items
    const insertItem = db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, subtotal, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertItemModifier = db.prepare(`
      INSERT INTO order_item_modifiers (id, order_item_id, modifier_id, modifier_name, price_adjustment)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    items.forEach(item => {
      const itemId = uuidv4();
      // Handle both payload formats
      const itemName = item.productName || item.itemName || 'Unknown Item';
      const unitPrice = item.unitPrice || (item.lineTotal / (item.quantity || 1));
      const quantity = item.quantity || 1;
      const itemSubtotal = unitPrice * quantity;
      const itemNotes = item.notes || item.specialInstructions || null;
      
      insertItem.run(itemId, orderId, item.productId || null, itemName, quantity, unitPrice, itemSubtotal, itemNotes);
      
      // Insert modifiers if any
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(mod => {
          const modName = mod.name || mod.modifierName || 'Unknown Modifier';
          const modPrice = mod.priceAdjustment || mod.price || 0;
          insertItemModifier.run(uuidv4(), itemId, mod.id || mod.modifierId || null, modName, modPrice);
        });
      }
    });
    
    // Add to sync queue
    db.prepare(`
      INSERT INTO sync_queue (id, table_name, record_id, action, data)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), 'orders', orderId, 'create', JSON.stringify({ orderId, orderNumber }));
    
    res.json({
      id: orderId,
      orderNumber,
      status,
      orderType,
      subtotal,
      taxAmount,
      totalAmount,
      paidAmount,
      paymentMethod,
      paymentStatus,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status (PATCH)
app.patch('/api/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, orderStatus } = req.body;
    const db = getDb();
    
    const finalStatus = status || orderStatus;
    const completedAt = finalStatus === 'completed' ? new Date().toISOString() : null;
    
    db.prepare(`
      UPDATE orders SET status = ?, completed_at = COALESCE(?, completed_at), updated_at = datetime('now')
      WHERE id = ?
    `).run(finalStatus, completedAt, id);
    
    res.json({ id, status: finalStatus, orderStatus: finalStatus });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Update order status (PUT - for compatibility)
app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, orderStatus } = req.body;
    const db = getDb();
    
    const finalStatus = status || orderStatus;
    const completedAt = finalStatus === 'completed' ? new Date().toISOString() : null;
    
    db.prepare(`
      UPDATE orders SET status = ?, completed_at = COALESCE(?, completed_at), updated_at = datetime('now')
      WHERE id = ?
    `).run(finalStatus, completedAt, id);
    
    res.json({ id, status: finalStatus, orderStatus: finalStatus });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Update payment (PUT - for compatibility with POS terminal)
app.put('/api/orders/:id/payment', (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentStatus, amountPaid } = req.body;
    const db = getDb();
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const finalPaidAmount = amountPaid || order.total_amount;
    
    db.prepare(`
      UPDATE orders SET 
        payment_method = ?,
        paid_amount = ?,
        payment_status = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(paymentMethod, finalPaidAmount, paymentStatus || 'paid', id);
    
    res.json({
      id,
      paymentMethod,
      paidAmount: finalPaidAmount,
      paymentStatus: paymentStatus || 'paid',
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Complete payment (POST)
app.post('/api/orders/:id/pay', (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paidAmount } = req.body;
    const db = getDb();
    
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const finalPaidAmount = paidAmount || order.total_amount;
    
    db.prepare(`
      UPDATE orders SET 
        payment_method = ?,
        paid_amount = ?,
        payment_status = 'paid',
        status = 'completed',
        completed_at = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(paymentMethod, finalPaidAmount, id);
    
    res.json({
      id,
      paymentMethod,
      paidAmount: finalPaidAmount,
      paymentStatus: 'paid',
      status: 'completed',
    });
  } catch (error) {
    console.error('Complete payment error:', error);
    res.status(500).json({ error: 'Failed to complete payment' });
  }
});

// Void order
app.post('/api/orders/:id/void', (req, res) => {
  try {
    const { id } = req.params;
    const { reason, userId } = req.body;
    const db = getDb();
    
    db.prepare(`
      UPDATE orders SET 
        status = 'voided',
        voided_at = datetime('now'),
        voided_by = ?,
        void_reason = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(userId || null, reason || null, id);
    
    res.json({ id, status: 'voided' });
  } catch (error) {
    console.error('Void order error:', error);
    res.status(500).json({ error: 'Failed to void order' });
  }
});

// ========================================
// SETTINGS & SERVER INFO
// ========================================

app.get('/api/settings', (req, res) => {
  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM settings').all();
    
    const result = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });
    
    res.json(result);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const db = getDb();
    const updates = req.body;
    
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now"))');
    
    Object.entries(updates).forEach(([key, value]) => {
      upsert.run(key, value);
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Server info endpoint (for discovery)
app.get('/api/server/info', (req, res) => {
  res.json({
    name: 'BIZPOS Local Server',
    version: '1.0.0',
    mode: 'server',
    ips: getLocalIPs(),
    port: PORT,
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========================================
// DAILY SALES REPORT
// ========================================

app.get('/api/reports/daily', (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const db = getDb();
    
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(discount_amount), 0) as total_discounts,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END), 0) as card_sales
      FROM orders 
      WHERE date(created_at) = ? AND status != 'voided'
    `).get(targetDate);
    
    res.json({
      date: targetDate,
      totalOrders: stats.total_orders,
      totalRevenue: stats.total_revenue,
      totalTax: stats.total_tax,
      totalDiscounts: stats.total_discounts,
      cashSales: stats.cash_sales,
      cardSales: stats.card_sales,
    });
  } catch (error) {
    console.error('Get daily report error:', error);
    res.status(500).json({ error: 'Failed to get daily report' });
  }
});

// ========================================
// DISCOVERY & SYNC SERVICES
// ========================================

const { DiscoveryService } = require('./discovery');
const { CloudSyncService } = require('./sync-service');
const { LocalSocketServer } = require('./socket-server');

let discoveryService = null;
let cloudSyncService = null;
let socketServer = null;
let serverId = null;

// Discovery endpoints
app.get('/api/discovery/servers', async (req, res) => {
  try {
    const tempDiscovery = new DiscoveryService();
    const timeout = parseInt(req.query.timeout) || 5000;
    const servers = await tempDiscovery.discoverServers(timeout);
    res.json({ servers });
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({ error: 'Discovery failed' });
  }
});

app.get('/api/discovery/local-ips', (req, res) => {
  res.json({ ips: getLocalIPs(), port: PORT });
});

// Sync endpoints
app.get('/api/sync/status', (req, res) => {
  try {
    if (!cloudSyncService) {
      return res.json({ configured: false });
    }
    const status = cloudSyncService.getSyncStatus();
    res.json({ configured: true, ...status });
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

app.post('/api/sync/configure', (req, res) => {
  try {
    const { cloudBaseUrl, locationId, authToken } = req.body;
    
    if (!cloudSyncService) {
      cloudSyncService = new CloudSyncService(getDb(), cloudBaseUrl);
    }
    
    cloudSyncService.configure({ cloudBaseUrl, locationId, authToken });
    
    // Save config to database
    const db = getDb();
    db.prepare(`INSERT OR REPLACE INTO config (key, value) VALUES ('cloud_base_url', ?)`).run(cloudBaseUrl || '');
    db.prepare(`INSERT OR REPLACE INTO config (key, value) VALUES ('location_id', ?)`).run(locationId || '');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Sync configure error:', error);
    res.status(500).json({ error: 'Failed to configure sync' });
  }
});

app.post('/api/sync/now', async (req, res) => {
  try {
    if (!cloudSyncService) {
      return res.status(400).json({ error: 'Sync not configured' });
    }
    
    const result = await cloudSyncService.syncAll();
    res.json(result);
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

app.post('/api/sync/upload-orders', async (req, res) => {
  try {
    if (!cloudSyncService) {
      return res.status(400).json({ error: 'Sync not configured' });
    }
    
    const result = await cloudSyncService.uploadPendingOrders();
    res.json(result);
  } catch (error) {
    console.error('Upload orders error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.post('/api/sync/download-menu', async (req, res) => {
  try {
    if (!cloudSyncService) {
      return res.status(400).json({ error: 'Sync not configured' });
    }
    
    const result = await cloudSyncService.downloadMenuUpdates();
    res.json(result);
  } catch (error) {
    console.error('Download menu error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

app.post('/api/sync/force-menu-sync', async (req, res) => {
  try {
    if (!cloudSyncService) {
      return res.status(400).json({ error: 'Sync not configured' });
    }
    
    const result = await cloudSyncService.forceFullMenuSync();
    res.json(result);
  } catch (error) {
    console.error('Force menu sync error:', error);
    res.status(500).json({ error: 'Force sync failed' });
  }
});

app.post('/api/sync/retry-failed', (req, res) => {
  try {
    if (!cloudSyncService) {
      return res.status(400).json({ error: 'Sync not configured' });
    }
    
    const result = cloudSyncService.retryFailedSyncs();
    res.json(result);
  } catch (error) {
    console.error('Retry failed error:', error);
    res.status(500).json({ error: 'Retry failed' });
  }
});

app.get('/api/sync/check-online', async (req, res) => {
  try {
    if (!cloudSyncService) {
      return res.json({ isOnline: false, configured: false });
    }
    
    const isOnline = await cloudSyncService.checkOnlineStatus();
    res.json({ isOnline, configured: true });
  } catch (error) {
    console.error('Check online error:', error);
    res.status(500).json({ error: 'Check failed' });
  }
});

// ========================================
// START SERVER
// ========================================

function startServer(options = {}) {
  // Initialize database if needed
  const dbPath = getDbPath();
  if (!fs.existsSync(dbPath)) {
    console.log('Database not found, initializing...');
    require('./init-db');
  }
  
  // Generate server ID
  serverId = options.serverId || `bizpos-${Date.now()}`;
  
  // Create HTTP server
  const http = require('http');
  const httpServer = http.createServer(app);
  
  // Initialize Socket.IO server
  socketServer = new LocalSocketServer();
  socketServer.initialize(httpServer);
  
  httpServer.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalIPs();
    console.log('');
    console.log('========================================');
    console.log('   BIZPOS Local Server Running!');
    console.log('========================================');
    console.log(`   Local:    http://localhost:${PORT}`);
    ips.forEach(ip => {
      console.log(`   Network:  http://${ip}:${PORT}`);
    });
    console.log('========================================');
    console.log('');
    console.log('Other POS terminals can connect to any');
    console.log('of the Network addresses above.');
    console.log('');
    
    // Start discovery broadcasting if in server mode
    if (options.enableDiscovery !== false) {
      discoveryService = new DiscoveryService();
      discoveryService.startServer({
        id: serverId,
        name: options.serverName || 'BIZPOS Server',
        port: PORT,
        version: '1.0.0',
      });
      console.log('Discovery service broadcasting on LAN...');
    }
    
    // Initialize cloud sync service
    const db = getDb();
    const cloudUrl = db.prepare(`SELECT value FROM config WHERE key = 'cloud_base_url'`).get();
    const locationId = db.prepare(`SELECT value FROM config WHERE key = 'location_id'`).get();
    
    if (cloudUrl?.value) {
      cloudSyncService = new CloudSyncService(db, cloudUrl.value);
      cloudSyncService.configure({
        locationId: locationId?.value,
      });
      cloudSyncService.startAutoSync(60000); // Sync every minute
      console.log('Cloud sync service started...');
    }
    
    console.log('WebSocket server ready for real-time connections...');
  });
  
  return httpServer;
}

function stopServer() {
  if (discoveryService) {
    discoveryService.stopServer();
    discoveryService = null;
  }
  if (cloudSyncService) {
    cloudSyncService.stopAutoSync();
    cloudSyncService = null;
  }
  socketServer = null;
}

// Get socket server instance for external use
function getSocketServer() {
  return socketServer;
}

// Export for use in Electron
module.exports = { startServer, stopServer, app, getLocalIPs, PORT, DiscoveryService, CloudSyncService, getSocketServer };

// Start if run directly
if (require.main === module) {
  startServer();
}
