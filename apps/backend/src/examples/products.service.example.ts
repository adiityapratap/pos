/**
 * Example Service: Products
 * 
 * This demonstrates how to use Prisma with the POS schema
 * for CRUD operations on products with multi-tenant support
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface CreateProductDto {
  tenantId: string;
  categoryId?: string;
  name: string;
  displayName?: string;
  basePrice: number;
  costPrice?: number;
  sku?: string;
  description?: string;
  prepTimeMinutes?: number;
  kitchenStation?: string;
}

interface UpdateProductDto {
  name?: string;
  displayName?: string;
  basePrice?: number;
  costPrice?: number;
  isActive?: boolean;
  currentStock?: number;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all active products for a tenant
   */
  async findAll(tenantId: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        category: true,
        modifierGroups: {
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
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get a single product by ID
   */
  async findOne(id: string, tenantId: string) {
    return this.prisma.product.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        category: true,
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: true,
              },
            },
          },
        },
        locationPrices: {
          include: {
            location: true,
          },
        },
        recipes: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });
  }

  /**
   * Create a new product
   */
  async create(data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        tenantId: data.tenantId,
        categoryId: data.categoryId,
        name: data.name,
        displayName: data.displayName || data.name,
        basePrice: data.basePrice,
        costPrice: data.costPrice,
        sku: data.sku,
        description: data.description,
        prepTimeMinutes: data.prepTimeMinutes || 0,
        kitchenStation: data.kitchenStation,
        isActive: true,
      },
      include: {
        category: true,
      },
    });
  }

  /**
   * Update a product
   */
  async update(id: string, tenantId: string, data: UpdateProductDto) {
    return this.prisma.product.update({
      where: {
        id,
        tenantId,
      },
      data,
    });
  }

  /**
   * Soft delete a product
   */
  async remove(id: string, tenantId: string) {
    return this.prisma.product.update({
      where: {
        id,
        tenantId,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  /**
   * Search products by name
   */
  async search(tenantId: string, query: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        category: true,
      },
      take: 20,
    });
  }

  /**
   * Get products by category
   */
  async findByCategory(tenantId: string, categoryId: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        categoryId,
        deletedAt: null,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Check product stock
   */
  async checkStock(productId: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      select: {
        id: true,
        name: true,
        trackInventory: true,
        currentStock: true,
        lowStockThreshold: true,
        outOfStock: true,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.trackInventory) {
      return {
        available: true,
        message: 'Stock not tracked',
      };
    }

    const isLowStock =
      product.currentStock &&
      product.lowStockThreshold &&
      product.currentStock <= product.lowStockThreshold;

    return {
      available: !product.outOfStock,
      currentStock: product.currentStock,
      lowStockThreshold: product.lowStockThreshold,
      isLowStock,
      message: product.outOfStock
        ? 'Out of stock'
        : isLowStock
          ? 'Low stock'
          : 'In stock',
    };
  }

  /**
   * Update product stock
   */
  async updateStock(
    productId: string,
    tenantId: string,
    quantity: number,
    operation: 'add' | 'subtract' | 'set',
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      select: { currentStock: true, trackInventory: true },
    });

    if (!product || !product.trackInventory) {
      throw new Error('Product not found or stock not tracked');
    }

    let newStock: number;
    switch (operation) {
      case 'add':
        newStock = (product.currentStock?.toNumber() || 0) + quantity;
        break;
      case 'subtract':
        newStock = (product.currentStock?.toNumber() || 0) - quantity;
        break;
      case 'set':
        newStock = quantity;
        break;
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        currentStock: newStock,
        outOfStock: newStock <= 0,
      },
    });
  }

  /**
   * Get product with location-specific pricing
   */
  async getProductForLocation(
    productId: string,
    locationId: string,
    tenantId: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId, deletedAt: null },
      include: {
        category: true,
        locationPrices: {
          where: { locationId, isActive: true },
        },
      },
    });

    if (!product) {
      return null;
    }

    // Use location-specific price if available, otherwise use base price
    const price =
      product.locationPrices[0]?.price || product.basePrice;

    return {
      ...product,
      effectivePrice: price,
    };
  }
}
