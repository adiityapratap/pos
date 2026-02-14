import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateLocationPriceDto,
  UpdateLocationPriceDto,
  ProductAvailabilityDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Helper method to transform database product to API response
  private transformProduct(product: any) {
    return {
      ...product,
      price: product.basePrice ? Number(product.basePrice) : 0,
      cost: product.costPrice ? Number(product.costPrice) : 0,
      stockQuantity: product.currentStock ? Number(product.currentStock) : 0,
      type: product.productType,
    };
  }

  async create(tenantId: string, dto: CreateProductDto) {
    // Verify category exists
    const category = await this.prisma.category.findFirst({
      where: {
        id: dto.categoryId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    // If parent product provided, verify it exists
    if (dto.parentProductId) {
      const parent = await this.prisma.product.findFirst({
        where: {
          id: dto.parentProductId,
          tenantId,
          deletedAt: null,
        },
      });

      if (!parent) {
        throw new BadRequestException('Parent product not found');
      }
    }

    return this.transformProduct(
      await this.prisma.product.create({
        data: {
          tenantId,
          categoryId: dto.categoryId,
          name: dto.name,
          displayName: dto.displayName,
          description: dto.description,
          productType: dto.type || 'standard', // Map to schema field
          parentProductId: dto.parentProductId,
          basePrice: dto.price, // Map to schema field
          costPrice: dto.cost,
          sku: dto.sku,
          imageUrl: dto.imageUrl,
          isActive: dto.isActive ?? true,
          trackInventory: dto.trackInventory ?? false,
          currentStock: dto.stockQuantity ?? 0, // Map to schema field
          lowStockThreshold: dto.lowStockThreshold,
          metadata: dto.metadata || {},
        },
        include: {
          category: true,
          parentProduct: true,
        },
      }),
    );
  }

  async findAll(
    tenantId: string,
    options: {
      categoryId?: string;
      includeInactive?: boolean;
      type?: string;
      search?: string;
    } = {},
  ) {
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (!options.includeInactive) {
      where.isActive = true;
    }

    if (options.type) {
      where.productType = options.type; // Map to schema field
    }

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { sku: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        parentProduct: true,
        modifierGroups: { // Match schema relation name
          include: {
            modifierGroup: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map(product => this.transformProduct(product));
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        category: true,
        parentProduct: true,
        variants: true,
        modifierGroups: { // Match schema relation name
          include: {
            modifierGroup: {
              include: {
                modifiers: true,
              },
            },
          },
        },
        locationPrices: { // Match schema relation name
          include: {
            location: true,
          },
        },
        comboItemsAsCombo: { // Match schema relation name
          include: {
            itemProduct: true, // Match schema relation name
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.transformProduct(product);
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(tenantId, id);

    // Verify category if changing
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: dto.categoryId,
          tenantId,
          deletedAt: null,
        },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.type !== undefined) updateData.productType = dto.type; // Map to schema field
    if (dto.price !== undefined) updateData.basePrice = dto.price; // Map to schema field
    if (dto.cost !== undefined) updateData.costPrice = dto.cost;
    if (dto.sku !== undefined) updateData.sku = dto.sku;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.trackInventory !== undefined) updateData.trackInventory = dto.trackInventory;
    if (dto.stockQuantity !== undefined) updateData.currentStock = dto.stockQuantity; // Map to schema field
    if (dto.lowStockThreshold !== undefined) updateData.lowStockThreshold = dto.lowStockThreshold;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;

    return this.transformProduct(
      await this.prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          parentProduct: true,
        },
      }),
    );
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Location Pricing
  async setLocationPrice(
    tenantId: string,
    productId: string,
    dto: CreateLocationPriceDto,
  ) {
    // Verify product exists
    await this.findOne(tenantId, productId);

    // Verify location belongs to tenant
    const location = await this.prisma.location.findFirst({
      where: {
        id: dto.locationId,
        tenantId,
      },
    });

    if (!location) {
      throw new BadRequestException('Location not found');
    }

    return this.prisma.productLocationPrice.upsert({
      where: {
        product_location_prices_unique: { // Use actual unique constraint name
          productId,
          locationId: dto.locationId,
        },
      },
      create: {
        tenantId, // Add tenantId
        productId,
        locationId: dto.locationId,
        price: dto.price,
      },
      update: {
        price: dto.price,
      },
    });
  }

  async getProductPrice(tenantId: string, productId: string, locationId?: string) {
    const product = await this.findOne(tenantId, productId);

    if (!locationId) {
      return { price: product.basePrice }; // Use schema field
    }

    const locationPrice = await this.prisma.productLocationPrice.findUnique({
      where: {
        product_location_prices_unique: { // Use actual unique constraint name
          productId,
          locationId,
        },
      },
    });

    return {
      price: locationPrice?.price ?? product.basePrice, // Use schema field
      isLocationSpecific: !!locationPrice,
    };
  }

  async removeLocationPrice(tenantId: string, productId: string, locationId: string) {
    await this.findOne(tenantId, productId);

    await this.prisma.productLocationPrice.delete({
      where: {
        product_location_prices_unique: { // Use actual unique constraint name
          productId,
          locationId,
        },
      },
    });

    return { success: true };
  }

  // Availability
  async setAvailability(
    tenantId: string,
    productId: string,
    dto: ProductAvailabilityDto,
  ) {
    await this.findOne(tenantId, productId);

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        metadata: {
          availability: dto as any, // Cast to any for JSON type
        },
      },
    });
  }

  isProductAvailable(product: any, currentDate = new Date()): boolean {
    const availability = product.metadata?.availability;
    if (!availability) return true;

    // Check day of week
    if (availability.availableDays?.length > 0) {
      const currentDay = currentDate.getDay();
      if (!availability.availableDays.includes(currentDay)) {
        return false;
      }
    }

    // Check time range
    if (availability.availableTimeStart && availability.availableTimeEnd) {
      const currentTime = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;
      if (
        currentTime < availability.availableTimeStart ||
        currentTime > availability.availableTimeEnd
      ) {
        return false;
      }
    }

    // Check unavailable dates
    if (availability.unavailableDates?.length > 0) {
      const currentDateStr = currentDate.toISOString().split('T')[0];
      if (availability.unavailableDates.some((d: any) => d.split('T')[0] === currentDateStr)) {
        return false;
      }
    }

    return true;
  }

  // Bulk stock update
  async updateStock(tenantId: string, productId: string, quantity: number) {
    const product = await this.findOne(tenantId, productId);

    if (!product.trackInventory) {
      throw new BadRequestException('This product does not track inventory');
    }

    const currentStock = product.currentStock ? Number(product.currentStock) : 0; // Convert Decimal to number

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        currentStock: currentStock + quantity, // Use schema field
      },
    });
  }
}
