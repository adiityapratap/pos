import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
  ) {}

  /**
   * Optimized menu loader for POS terminals
   * Loads everything in minimal queries with proper relations
   * Returns cache-friendly structure
   */
  async getPOSMenu(tenantId: string, locationId?: string) {
    const currentDate = new Date();

    // Fetch everything in parallel
    const [categories, modifierGroups] = await Promise.all([
      // Categories with products
      this.prisma.category.findMany({
        where: {
          tenantId,
          isActive: true,
          deletedAt: null,
        },
        include: {
          products: {
            where: {
              isActive: true,
              deletedAt: null,
            },
            include: {
              modifierGroups: { // Match schema relation name
                where: { isActive: true },
                include: {
                  modifierGroup: {
                    include: {
                      modifiers: {
                        where: { isActive: true },
                        orderBy: { sortOrder: 'asc' },
                      },
                    },
                  },
                },
                orderBy: { sortOrder: 'asc' },
              },
              comboItemsAsCombo: { // Match schema relation name
                include: {
                  itemProduct: true, // Match schema relation name
                },
                orderBy: { sortOrder: 'asc' },
              },
              locationPrices: locationId ? { // Match schema relation name
                where: { locationId },
              } : false,
              category: true,
            },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' },
        ],
      }),

      // Modifier groups (separate for efficiency)
      this.prisma.modifierGroup.findMany({
        where: {
          tenantId,
          deletedAt: null, // Use deletedAt instead of isActive
        },
        include: {
          modifiers: {
            where: { isActive: true, deletedAt: null },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    // Build category tree
    const categoryMap = new Map<string, any>();
    const rootCategories: any[] = [];

    categories.forEach(cat => {
      // Filter products by availability
      const availableProducts = cat.products.filter(product => 
        this.productsService.isProductAvailable(product, currentDate)
      );

      // Enhance products with location pricing if specified
      const enhancedProducts = availableProducts.map(product => {
        const locationPrice = product.locationPrices?.[0]; // Use correct relation name
        const effectivePrice = locationPrice?.price ?? product.basePrice; // Use correct field name

        // Check stock availability
        const isInStock = !product.trackInventory || 
                         (product.currentStock && Number(product.currentStock) > 0); // Convert Decimal to number

        // Check if product has modifiers
        const hasModifiers = product.modifierGroups.length > 0; // Use correct relation name

        // Check if combo
        const isCombo = product.productType === 'combo' && product.comboItemsAsCombo.length > 0; // Use correct fields

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: effectivePrice,
          basePrice: product.basePrice, // Use correct field name
          sku: product.sku,
          imageUrl: product.imageUrl,
          type: product.productType, // Use correct field name
          categoryId: product.categoryId,
          hasModifiers,
          isCombo,
          isInStock,
          trackInventory: product.trackInventory,
          stockQuantity: product.currentStock, // Use correct field name
          lowStockThreshold: product.lowStockThreshold,
          metadata: product.metadata,
          // Include modifier groups directly
          modifierGroups: product.modifierGroups.map(pmg => ({ // Use correct relation name
            id: pmg.modifierGroup.id,
            name: pmg.modifierGroup.name,
            description: pmg.modifierGroup.description,
            isRequired: pmg.isRequired ?? pmg.modifierGroup.isRequired,
            minSelections: pmg.minSelections ?? pmg.modifierGroup.minSelections,
            maxSelections: pmg.maxSelections ?? pmg.modifierGroup.maxSelections,
            sortOrder: pmg.sortOrder,
            modifiers: pmg.modifierGroup.modifiers.map(mod => ({
              id: mod.id,
              name: mod.name,
              priceChangeType: mod.priceType, // Use correct field name
              priceChange: mod.priceChange,
              isDefault: mod.isDefault,
              sortOrder: mod.sortOrder,
              isInStock: true, // Simplified - schema doesn't have trackStock field
            })),
          })),
          // Include combo items if applicable
          comboItems: isCombo ? product.comboItemsAsCombo.map(item => ({ // Use correct relation name
            id: item.id,
            productId: item.itemProductId, // Use correct field name
            productName: item.itemProduct.name, // Use correct relation name
            quantity: item.quantity,
            priceOverride: item.priceOverride,
            selectionGroup: item.selectionGroup,
            sortOrder: item.sortOrder,
          })) : [],
        };
      });

      const categoryNode = {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        parentId: cat.parentId,
        sortOrder: cat.sortOrder,
        imageUrl: cat.imageUrl,
        products: enhancedProducts,
        children: [] as any[],
      };

      categoryMap.set(cat.id, categoryNode);
    });

    // Build hierarchy
    categories.forEach(cat => {
      const categoryNode = categoryMap.get(cat.id);
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId).children.push(categoryNode);
      } else {
        rootCategories.push(categoryNode);
      }
    });

    // Calculate totals
    const totalCategories = categories.length;
    const totalProducts = categories.reduce((sum, cat) => sum + cat.products.length, 0);
    const totalModifierGroups = modifierGroups.length;
    const totalModifiers = modifierGroups.reduce((sum, group) => sum + (group.modifiers?.length || 0), 0); // Add null check

    return {
      version: this.generateMenuVersion(tenantId, currentDate),
      timestamp: currentDate.toISOString(),
      location: locationId,
      categories: rootCategories,
      stats: {
        totalCategories,
        totalProducts,
        totalModifierGroups,
        totalModifiers,
      },
    };
  }

  /**
   * Get flat list of all products (for search)
   */
  async getProductsList(tenantId: string, locationId?: string) {
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        category: true,
        locationPrices: locationId ? { // Match schema relation name
          where: { locationId },
        } : false,
      },
      orderBy: { name: 'asc' },
    });

    return products.map(product => {
      const locationPrice = product.locationPrices?.[0]; // Use correct relation name
      const effectivePrice = locationPrice?.price ?? product.basePrice; // Use correct field name

      return {
        id: product.id,
        name: product.name,
        price: effectivePrice,
        basePrice: product.basePrice, // Use correct field name
        sku: product.sku,
        imageUrl: product.imageUrl,
        categoryId: product.categoryId,
        categoryName: product.category?.name || '', // Add null check
        type: product.productType, // Use correct field name
      };
    });
  }

  /**
   * Generate a version hash for the menu
   * Used for cache invalidation
   */
  private generateMenuVersion(tenantId: string, date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.getHours().toString().padStart(2, '0');
    return `${tenantId.substring(0, 8)}-${dateStr}-${timeStr}`;
  }

  /**
   * Check if menu has been updated since a version
   */
  async hasMenuUpdated(tenantId: string, sinceVersion: string): Promise<boolean> {
    const currentVersion = this.generateMenuVersion(tenantId, new Date());
    return currentVersion !== sinceVersion;
  }
}
