/**
 * BIZPOS Cloud Sync Service
 * Handles syncing local data with cloud backend
 * - Uploads orders when online
 * - Downloads menu updates from owner portal
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class CloudSyncService {
  constructor(db, cloudBaseUrl) {
    this.db = db;
    this.cloudBaseUrl = cloudBaseUrl;
    this.syncInProgress = false;
    this.locationId = null;
    this.authToken = null;
    this.syncInterval = null;
    this.onlineCheckInterval = null;
    this.isOnline = false;
  }

  /**
   * Configure the sync service
   */
  configure(config) {
    this.cloudBaseUrl = config.cloudBaseUrl || this.cloudBaseUrl;
    this.locationId = config.locationId;
    this.authToken = config.authToken;
  }

  /**
   * Check if we can reach the cloud server
   */
  async checkOnlineStatus() {
    if (!this.cloudBaseUrl) {
      this.isOnline = false;
      return false;
    }

    try {
      const response = await this.makeRequest('GET', '/health', null, 5000);
      this.isOnline = response.status === 'ok';
      return this.isOnline;
    } catch (error) {
      this.isOnline = false;
      return false;
    }
  }

  /**
   * Make HTTP request to cloud server
   */
  makeRequest(method, path, body = null, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.cloudBaseUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        timeout: timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      if (this.authToken) {
        options.headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            resolve({ raw: data, statusCode: res.statusCode });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  /**
   * Start automatic sync with interval
   */
  startAutoSync(intervalMs = 60000) {
    // Check online status periodically
    this.onlineCheckInterval = setInterval(async () => {
      await this.checkOnlineStatus();
    }, 30000);

    // Sync periodically when online
    this.syncInterval = setInterval(async () => {
      if (this.isOnline && !this.syncInProgress) {
        await this.syncAll();
      }
    }, intervalMs);

    // Do initial check
    this.checkOnlineStatus();
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.onlineCheckInterval) {
      clearInterval(this.onlineCheckInterval);
      this.onlineCheckInterval = null;
    }
  }

  /**
   * Sync all data (orders up, menu down)
   */
  async syncAll() {
    if (this.syncInProgress) {
      return { success: false, error: 'Sync already in progress' };
    }

    this.syncInProgress = true;
    const results = {
      orderSync: null,
      menuSync: null,
      errors: [],
    };

    try {
      // Upload pending orders
      results.orderSync = await this.uploadPendingOrders();
    } catch (error) {
      results.errors.push({ type: 'orderSync', error: error.message });
    }

    try {
      // Download menu updates
      results.menuSync = await this.downloadMenuUpdates();
    } catch (error) {
      results.errors.push({ type: 'menuSync', error: error.message });
    }

    this.syncInProgress = false;
    return results;
  }

  /**
   * Upload pending orders to cloud
   */
  async uploadPendingOrders() {
    if (!this.isOnline) {
      return { success: false, error: 'Offline' };
    }

    // Get pending orders from sync queue
    const pendingOrders = this.db.prepare(`
      SELECT sq.*, o.order_number, o.status, o.payment_method, o.subtotal, o.tax, o.total,
             o.customer_name, o.notes, o.created_at
      FROM sync_queue sq
      JOIN orders o ON sq.record_id = o.id
      WHERE sq.entity_type = 'order' AND sq.sync_status = 'pending'
      ORDER BY sq.created_at ASC
      LIMIT 50
    `).all();

    if (pendingOrders.length === 0) {
      return { success: true, uploaded: 0 };
    }

    let uploadedCount = 0;
    const errors = [];

    for (const order of pendingOrders) {
      try {
        // Get order items
        const items = this.db.prepare(`
          SELECT * FROM order_items WHERE order_id = ?
        `).all(order.record_id);

        const orderData = {
          localId: order.record_id,
          orderNumber: order.order_number,
          status: order.status,
          paymentMethod: order.payment_method,
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
          customerName: order.customer_name,
          notes: order.notes,
          items: items.map(item => ({
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            modifiers: item.modifiers ? JSON.parse(item.modifiers) : [],
            subtotal: item.subtotal,
          })),
          createdAt: order.created_at,
          locationId: this.locationId,
        };

        // Upload to cloud
        await this.makeRequest('POST', '/api/orders/sync', orderData);

        // Mark as synced
        this.db.prepare(`
          UPDATE sync_queue SET sync_status = 'synced', synced_at = datetime('now')
          WHERE id = ?
        `).run(order.id);

        uploadedCount++;
      } catch (error) {
        errors.push({ orderId: order.record_id, error: error.message });
        
        // Mark as failed
        this.db.prepare(`
          UPDATE sync_queue SET sync_status = 'failed', last_error = ?
          WHERE id = ?
        `).run(error.message, order.id);
      }
    }

    return { success: true, uploaded: uploadedCount, errors };
  }

  /**
   * Download menu updates from cloud
   */
  async downloadMenuUpdates() {
    if (!this.isOnline || !this.locationId) {
      return { success: false, error: 'Offline or no location configured' };
    }

    try {
      // Get last sync timestamp
      const lastSync = this.db.prepare(`
        SELECT value FROM config WHERE key = 'last_menu_sync'
      `).get();
      
      const lastSyncTime = lastSync?.value || '1970-01-01T00:00:00Z';

      // Fetch updates from cloud
      const response = await this.makeRequest(
        'GET', 
        `/api/locations/${this.locationId}/menu?updatedAfter=${encodeURIComponent(lastSyncTime)}`
      );

      if (!response || response.error) {
        throw new Error(response?.error || 'Failed to fetch menu');
      }

      // Update local database
      const updates = {
        categories: 0,
        products: 0,
        modifierGroups: 0,
        modifiers: 0,
      };

      // Process categories
      if (response.categories && Array.isArray(response.categories)) {
        for (const category of response.categories) {
          this.upsertCategory(category);
          updates.categories++;
        }
      }

      // Process products
      if (response.products && Array.isArray(response.products)) {
        for (const product of response.products) {
          this.upsertProduct(product);
          updates.products++;
        }
      }

      // Process modifier groups
      if (response.modifierGroups && Array.isArray(response.modifierGroups)) {
        for (const group of response.modifierGroups) {
          this.upsertModifierGroup(group);
          updates.modifierGroups++;
        }
      }

      // Process modifiers
      if (response.modifiers && Array.isArray(response.modifiers)) {
        for (const modifier of response.modifiers) {
          this.upsertModifier(modifier);
          updates.modifiers++;
        }
      }

      // Update last sync timestamp
      this.db.prepare(`
        INSERT OR REPLACE INTO config (key, value) VALUES ('last_menu_sync', ?)
      `).run(new Date().toISOString());

      return { success: true, updates };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Upsert category
   */
  upsertCategory(category) {
    this.db.prepare(`
      INSERT INTO categories (id, name, display_order, is_active, cloud_id, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        display_order = excluded.display_order,
        is_active = excluded.is_active,
        cloud_id = excluded.cloud_id,
        updated_at = datetime('now')
    `).run(
      category.id,
      category.name,
      category.displayOrder || 0,
      category.isActive !== false ? 1 : 0,
      category.cloudId || category.id
    );
  }

  /**
   * Upsert product
   */
  upsertProduct(product) {
    this.db.prepare(`
      INSERT INTO products (id, category_id, name, description, price, image_url, is_available, is_taxable, cloud_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        category_id = excluded.category_id,
        name = excluded.name,
        description = excluded.description,
        price = excluded.price,
        image_url = excluded.image_url,
        is_available = excluded.is_available,
        is_taxable = excluded.is_taxable,
        cloud_id = excluded.cloud_id,
        updated_at = datetime('now')
    `).run(
      product.id,
      product.categoryId,
      product.name,
      product.description || '',
      product.price || 0,
      product.imageUrl || null,
      product.isAvailable !== false ? 1 : 0,
      product.isTaxable !== false ? 1 : 0,
      product.cloudId || product.id
    );
  }

  /**
   * Upsert modifier group
   */
  upsertModifierGroup(group) {
    this.db.prepare(`
      INSERT INTO modifier_groups (id, name, min_selections, max_selections, is_required, cloud_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        min_selections = excluded.min_selections,
        max_selections = excluded.max_selections,
        is_required = excluded.is_required,
        cloud_id = excluded.cloud_id,
        updated_at = datetime('now')
    `).run(
      group.id,
      group.name,
      group.minSelections || 0,
      group.maxSelections || 1,
      group.isRequired ? 1 : 0,
      group.cloudId || group.id
    );
  }

  /**
   * Upsert modifier
   */
  upsertModifier(modifier) {
    this.db.prepare(`
      INSERT INTO modifiers (id, group_id, name, price, is_available, cloud_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        group_id = excluded.group_id,
        name = excluded.name,
        price = excluded.price,
        is_available = excluded.is_available,
        cloud_id = excluded.cloud_id,
        updated_at = datetime('now')
    `).run(
      modifier.id,
      modifier.groupId,
      modifier.name,
      modifier.price || 0,
      modifier.isAvailable !== false ? 1 : 0,
      modifier.cloudId || modifier.id
    );
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    const pendingOrders = this.db.prepare(`
      SELECT COUNT(*) as count FROM sync_queue WHERE sync_status = 'pending' AND entity_type = 'order'
    `).get();

    const failedOrders = this.db.prepare(`
      SELECT COUNT(*) as count FROM sync_queue WHERE sync_status = 'failed' AND entity_type = 'order'
    `).get();

    const lastSync = this.db.prepare(`
      SELECT value FROM config WHERE key = 'last_menu_sync'
    `).get();

    return {
      isOnline: this.isOnline,
      pendingOrderCount: pendingOrders?.count || 0,
      failedOrderCount: failedOrders?.count || 0,
      lastMenuSync: lastSync?.value || null,
      syncInProgress: this.syncInProgress,
    };
  }

  /**
   * Retry failed syncs
   */
  retryFailedSyncs() {
    this.db.prepare(`
      UPDATE sync_queue SET sync_status = 'pending', last_error = NULL
      WHERE sync_status = 'failed'
    `).run();

    return { success: true };
  }

  /**
   * Force full menu sync (ignores last sync time)
   */
  async forceFullMenuSync() {
    // Reset last sync time
    this.db.prepare(`
      DELETE FROM config WHERE key = 'last_menu_sync'
    `).run();

    return await this.downloadMenuUpdates();
  }
}

module.exports = { CloudSyncService };
