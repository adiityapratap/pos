import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateComboDto, CreateComboFromUIDto, AddComboItemDto, UpdateComboItemDto } from './dto/combo.dto';

@Injectable()
export class CombosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create combo from UI - creates both the combo product and its items
   */
  async createComboFromUI(tenantId: string, dto: CreateComboFromUIDto) {
    const { name, displayName, description, price, sortOrder, isActive, productIds, copyToAllLocations, locationIds } = dto;

    // Verify all item products exist
    const itemProducts = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId,
        deletedAt: null,
      },
    });

    if (itemProducts.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    // Get a default category for combos (or create one)
    let comboCategory = await this.prisma.category.findFirst({
      where: {
        tenantId,
        name: 'Combos',
        deletedAt: null,
      },
    });

    if (!comboCategory) {
      comboCategory = await this.prisma.category.create({
        data: {
          tenantId,
          name: 'Combos',
          displayName: 'Combo Deals',
          sortOrder: 999,
          isActive: true,
        },
      });
    }

    // Calculate regular price (sum of all products)
    const regularPrice = itemProducts.reduce((sum, p) => sum + Number(p.basePrice || 0), 0);

    // Create combo product and items in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Create the combo product
      const comboProduct = await tx.product.create({
        data: {
          tenantId,
          categoryId: comboCategory!.id,
          name,
          displayName: displayName || name,
          description,
          productType: 'combo',
          basePrice: price,
          isActive: isActive ?? true,
          metadata: {
            regularPrice,
            savings: regularPrice - price,
          },
        },
      });

      // Create combo items
      await tx.comboItem.createMany({
        data: productIds.map((productId, index) => ({
          tenantId,
          comboProductId: comboProduct.id,
          itemProductId: productId,
          quantity: 1,
          sortOrder: index,
        })),
      });

      // Return combo with items
      return tx.product.findUnique({
        where: { id: comboProduct.id },
        include: {
          category: true,
          comboItemsAsCombo: {
            include: {
              itemProduct: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });
  }

  /**
   * Update combo from UI
   */
  async updateComboFromUI(tenantId: string, comboId: string, dto: CreateComboFromUIDto) {
    const { name, displayName, description, price, sortOrder, isActive, productIds, copyToAllLocations, locationIds } = dto;

    // Verify combo exists
    const existingCombo = await this.prisma.product.findFirst({
      where: {
        id: comboId,
        tenantId,
        productType: 'combo',
        deletedAt: null,
      },
    });

    if (!existingCombo) {
      throw new NotFoundException('Combo not found');
    }

    // Verify all item products exist
    const itemProducts = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId,
        deletedAt: null,
      },
    });

    if (itemProducts.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    // Calculate regular price
    const regularPrice = itemProducts.reduce((sum, p) => sum + Number(p.basePrice || 0), 0);

    // Update in transaction
    return this.prisma.$transaction(async (tx) => {
      // Update the combo product
      await tx.product.update({
        where: { id: comboId },
        data: {
          name,
          displayName: displayName || name,
          description,
          basePrice: price,
          isActive: isActive ?? true,
          metadata: {
            regularPrice,
            savings: regularPrice - price,
          },
        },
      });

      // Delete existing combo items
      await tx.comboItem.deleteMany({
        where: { comboProductId: comboId },
      });

      // Create new combo items
      await tx.comboItem.createMany({
        data: productIds.map((productId, index) => ({
          tenantId,
          comboProductId: comboId,
          itemProductId: productId,
          quantity: 1,
          sortOrder: index,
        })),
      });

      // Return updated combo with items
      return tx.product.findUnique({
        where: { id: comboId },
        include: {
          category: true,
          comboItemsAsCombo: {
            include: {
              itemProduct: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });
  }

  /**
   * Delete combo (soft delete)
   */
  async deleteCombo(tenantId: string, comboId: string) {
    const combo = await this.prisma.product.findFirst({
      where: {
        id: comboId,
        tenantId,
        productType: 'combo',
        deletedAt: null,
      },
    });

    if (!combo) {
      throw new NotFoundException('Combo not found');
    }

    // Soft delete the combo product (items will be orphaned but that's OK)
    await this.prisma.product.update({
      where: { id: comboId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  async createCombo(tenantId: string, dto: CreateComboDto) {
    // Verify combo product exists and is a combo type
    const comboProduct = await this.prisma.product.findFirst({
      where: {
        id: dto.comboProductId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!comboProduct) {
      throw new NotFoundException('Combo product not found');
    }

    // Verify all item products exist
    const itemProductIds = dto.items.map(i => i.productId);
    const itemProducts = await this.prisma.product.findMany({
      where: {
        id: { in: itemProductIds },
        tenantId,
        deletedAt: null,
      },
    });

    if (itemProducts.length !== itemProductIds.length) {
      throw new BadRequestException('One or more item products not found');
    }

    // Delete existing combo items if any
    await this.prisma.comboItem.deleteMany({
      where: { comboProductId: dto.comboProductId },
    });

    // Create new combo items
    await this.prisma.comboItem.createMany({
      data: dto.items.map((item, index) => ({
        tenantId, // Add tenantId
        comboProductId: dto.comboProductId,
        itemProductId: item.productId, // Map to schema field
        quantity: item.quantity,
        priceOverride: item.priceOverride,
        selectionGroup: item.selectionGroup,
        sortOrder: item.sortOrder ?? index,
      })),
    });

    return this.getCombo(tenantId, dto.comboProductId);
  }

  async getCombo(tenantId: string, comboProductId: string) {
    const combo = await this.prisma.product.findFirst({
      where: {
        id: comboProductId,
        tenantId,
        deletedAt: null,
      },
      include: {
        comboItemsAsCombo: { // Match schema relation name
          include: {
            itemProduct: true, // Match schema relation name
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!combo) {
      throw new NotFoundException('Combo not found');
    }

    return combo;
  }

  async getAllCombos(tenantId: string) {
    const combos = await this.prisma.product.findMany({
      where: {
        tenantId,
        productType: 'combo',
        deletedAt: null,
      },
      include: {
        category: true,
        comboItemsAsCombo: {
          include: {
            itemProduct: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Transform to frontend format
    return combos.map(combo => {
      const comboProducts = combo.comboItemsAsCombo.map(item => ({
        productId: item.itemProductId,
        product: item.itemProduct ? {
          id: item.itemProduct.id,
          name: item.itemProduct.name,
          displayName: item.itemProduct.displayName,
          price: Number(item.itemProduct.basePrice || 0),
          imageUrl: item.itemProduct.imageUrl,
        } : undefined,
      }));

      const regularPrice = comboProducts.reduce((sum, cp) => sum + (cp.product?.price || 0), 0);
      const price = Number(combo.basePrice || 0);

      return {
        id: combo.id,
        name: combo.name,
        displayName: combo.displayName || combo.name,
        description: combo.description || '',
        price,
        regularPrice,
        savings: regularPrice - price,
        isActive: combo.isActive,
        sortOrder: combo.sortOrder,
        comboProducts,
      };
    });
  }

  async addComboItem(tenantId: string, comboProductId: string, dto: AddComboItemDto) {
    // Verify combo exists
    await this.getCombo(tenantId, comboProductId);

    // Verify item product exists
    const product = await this.prisma.product.findFirst({
      where: {
        id: dto.productId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Get max sort order
    const maxSortOrder = await this.prisma.comboItem.findFirst({
      where: { comboProductId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return this.prisma.comboItem.create({
      data: {
        tenantId, // Add tenantId
        comboProductId,
        itemProductId: dto.productId, // Map to schema field
        quantity: dto.quantity,
        priceOverride: dto.priceOverride,
        selectionGroup: dto.selectionGroup,
        sortOrder: dto.sortOrder ?? (maxSortOrder?.sortOrder ?? 0) + 1,
      },
      include: {
        itemProduct: true, // Match schema relation name
      },
    });
  }

  async updateComboItem(
    tenantId: string,
    comboProductId: string,
    comboItemId: string,
    dto: UpdateComboItemDto,
  ) {
    // Verify combo belongs to tenant
    await this.getCombo(tenantId, comboProductId);

    const comboItem = await this.prisma.comboItem.findUnique({
      where: { id: comboItemId },
    });

    if (!comboItem || comboItem.comboProductId !== comboProductId) {
      throw new NotFoundException('Combo item not found');
    }

    return this.prisma.comboItem.update({
      where: { id: comboItemId },
      data: dto,
      include: {
        itemProduct: true, // Match schema relation name
      },
    });
  }

  async removeComboItem(tenantId: string, comboProductId: string, comboItemId: string) {
    // Verify combo belongs to tenant
    await this.getCombo(tenantId, comboProductId);

    const comboItem = await this.prisma.comboItem.findUnique({
      where: { id: comboItemId },
    });

    if (!comboItem || comboItem.comboProductId !== comboProductId) {
      throw new NotFoundException('Combo item not found');
    }

    await this.prisma.comboItem.delete({
      where: { id: comboItemId },
    });

    return { success: true };
  }

  /**
   * Expand a combo into individual order items
   * Used during checkout
   */
  async expandComboForOrder(tenantId: string, comboProductId: string, quantity: number = 1) {
    const combo = await this.getCombo(tenantId, comboProductId);

    const expandedItems = combo.comboItemsAsCombo.map(item => ({ // Use correct relation name
      productId: item.itemProductId, // Use correct field name
      productName: item.itemProduct.name, // Use correct relation name
      quantity: item.quantity * quantity,
      price: item.priceOverride ?? item.itemProduct.basePrice, // Use correct field name
      selectionGroup: item.selectionGroup,
      isComboItem: true,
      comboProductId,
    }));

    return {
      comboProduct: {
        id: combo.id,
        name: combo.name,
        price: combo.basePrice, // Use correct field name
      },
      items: expandedItems,
      totalQuantity: expandedItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  /**
   * Group combo items by selection group (main, side, drink, etc.)
   */
  getComboItemsByGroup(comboItems: any[]) {
    const grouped: Record<string, any[]> = {};

    comboItems.forEach(item => {
      const group = item.selectionGroup || 'default';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(item);
    });

    return grouped;
  }
}
