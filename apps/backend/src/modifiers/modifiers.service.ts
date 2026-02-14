import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateModifierGroupDto,
  UpdateModifierGroupDto,
  CreateModifierDto,
  UpdateModifierDto,
  LinkModifierGroupDto,
  UpdateProductModifierGroupDto,
} from './dto/modifier.dto';

@Injectable()
export class ModifiersService {
  constructor(private prisma: PrismaService) {}

  // Helper methods to transform database objects to API response
  private transformModifier(modifier: any) {
    return {
      ...modifier,
      displayName: modifier.displayName || modifier.name, // Fallback to name if no displayName
      priceAdjustment: modifier.priceChange ? Number(modifier.priceChange) : 0,
      priceChangeType: modifier.priceType,
    };
  }

  private transformModifierGroup(group: any) {
    const transformed = { ...group };
    if (group.modifiers && Array.isArray(group.modifiers)) {
      transformed.modifiers = group.modifiers.map(m => this.transformModifier(m));
    }
    return transformed;
  }

  // ========== MODIFIER GROUPS ==========
  async createGroup(tenantId: string, dto: CreateModifierGroupDto) {
    return this.prisma.modifierGroup.create({
      data: {
        tenantId,
        name: dto.name,
        displayName: dto.displayName,
        shortName: dto.shortName,
        description: dto.description,
        selectionType: dto.selectionType || 'multiple',
        isRequired: dto.isRequired ?? false,
        minSelections: dto.minSelections ?? 0,
        maxSelections: dto.maxSelections ?? 1,
        sortOrder: dto.sortOrder ?? 0,
        displayInWizard: true,
        // Note: isActive doesn't exist in schema, use deletedAt for soft delete
      },
    });
  }

  async findAllGroups(tenantId: string, includeInactive = false) {
    const where: any = {
      tenantId,
    };

    // Use deletedAt instead of isActive
    if (!includeInactive) {
      where.deletedAt = null;
    }

    const groups = await this.prisma.modifierGroup.findMany({
      where,
      include: {
        modifiers: {
          where: includeInactive ? {} : { isActive: true, deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return groups.map(group => this.transformModifierGroup(group));
  }

  async findOneGroup(tenantId: string, id: string) {
    const group = await this.prisma.modifierGroup.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        modifiers: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    return this.transformModifierGroup(group);
  }

  async updateGroup(tenantId: string, id: string, dto: UpdateModifierGroupDto) {
    await this.findOneGroup(tenantId, id);

    // Validate min/max if provided
    if (dto.minSelections !== undefined && dto.maxSelections !== undefined) {
      if (dto.minSelections > dto.maxSelections) {
        throw new BadRequestException('Min selections cannot exceed max selections');
      }
    }

    return this.prisma.modifierGroup.update({
      where: { id },
      data: dto,
    });
  }

  async removeGroup(tenantId: string, id: string) {
    await this.findOneGroup(tenantId, id);

    // Check if group is linked to products
    const linkedProducts = await this.prisma.productModifierGroup.count({
      where: { modifierGroupId: id },
    });

    if (linkedProducts > 0) {
      throw new BadRequestException(
        'Cannot delete modifier group that is linked to products. Remove links first.',
      );
    }

    await this.prisma.modifierGroup.delete({
      where: { id },
    });

    return { success: true };
  }

  // ========== MODIFIERS ==========
  async createModifier(tenantId: string, dto: CreateModifierDto) {
    // Verify group exists and belongs to tenant
    const group = await this.findOneGroup(tenantId, dto.modifierGroupId);

    const modifier = await this.prisma.modifier.create({
      data: {
        tenantId,
        groupId: dto.modifierGroupId, // Map to schema field
        name: dto.name,
        displayName: dto.displayName || dto.name, // Default to name if not provided
        priceType: dto.priceChangeType || 'add', // Map to schema field
        priceChange: dto.priceChange ?? 0,
        isDefault: dto.isDefault ?? false,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    return this.transformModifier(modifier);
  }

  async findAllModifiers(
    tenantId: string,
    groupId?: string,
    includeInactive = false,
  ) {
    const where: any = {
      tenantId,
    };

    if (groupId) {
      where.groupId = groupId; // Map to schema field
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    const modifiers = await this.prisma.modifier.findMany({
      where,
      include: {
        group: true, // Match schema relation name
      },
      orderBy: { sortOrder: 'asc' },
    });

    return modifiers.map(m => this.transformModifier(m));
  }

  async findOneModifier(tenantId: string, id: string) {
    const modifier = await this.prisma.modifier.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        group: true, // Match schema relation name
      },
    });

    if (!modifier) {
      throw new NotFoundException('Modifier not found');
    }

    return this.transformModifier(modifier);
  }

  async updateModifier(tenantId: string, id: string, dto: UpdateModifierDto) {
    await this.findOneModifier(tenantId, id);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName || dto.name; // Set displayName, default to name if empty
    if (dto.priceChangeType !== undefined) updateData.priceType = dto.priceChangeType; // Map to schema field
    if (dto.priceChange !== undefined) updateData.priceChange = dto.priceChange;
    if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const updatedModifier = await this.prisma.modifier.update({
      where: { id },
      data: updateData,
    });

    return this.transformModifier(updatedModifier);
  }

  async removeModifier(tenantId: string, id: string) {
    await this.findOneModifier(tenantId, id);

    await this.prisma.modifier.delete({
      where: { id },
    });

    return { success: true };
  }

  // ========== PRODUCT MODIFIER GROUP MAPPING ==========
  async linkGroupToProduct(
    tenantId: string,
    productId: string,
    dto: LinkModifierGroupDto,
  ) {
    // Verify product exists
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verify modifier group exists
    await this.findOneGroup(tenantId, dto.modifierGroupId);

    // Check if already linked
    const existing = await this.prisma.productModifierGroup.findUnique({
      where: {
        product_modifier_groups_unique: { // Use actual unique constraint name from schema
          productId,
          modifierGroupId: dto.modifierGroupId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Modifier group already linked to this product');
    }

    return this.prisma.productModifierGroup.create({
      data: {
        tenantId, // Add tenantId
        productId,
        modifierGroupId: dto.modifierGroupId,
        sortOrder: dto.sortOrder ?? 0,
        isRequired: dto.isRequired,
        minSelections: dto.minSelections,
        maxSelections: dto.maxSelections,
        isActive: dto.isActive ?? true,
        metadata: dto.excludedModifierIds ? { excludedModifierIds: dto.excludedModifierIds } : {},
      },
      include: {
        modifierGroup: {
          include: {
            modifiers: true,
          },
        },
      },
    });
  }

  async updateProductModifierGroup(
    tenantId: string,
    productId: string,
    modifierGroupId: string,
    dto: UpdateProductModifierGroupDto,
  ) {
    // Verify product belongs to tenant
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const link = await this.prisma.productModifierGroup.findUnique({
      where: {
        product_modifier_groups_unique: { // Use actual unique constraint name
          productId,
          modifierGroupId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Product modifier group link not found');
    }

    const updateData: any = {};
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;
    if (dto.isRequired !== undefined) updateData.isRequired = dto.isRequired;
    if (dto.minSelections !== undefined) updateData.minSelections = dto.minSelections;
    if (dto.maxSelections !== undefined) updateData.maxSelections = dto.maxSelections;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    
    // Handle excluded modifiers in metadata
    if (dto.excludedModifierIds !== undefined) {
      const currentMetadata = (link.metadata as any) || {};
      updateData.metadata = {
        ...currentMetadata,
        excludedModifierIds: dto.excludedModifierIds,
      };
    }

    return this.prisma.productModifierGroup.update({
      where: {
        product_modifier_groups_unique: { // Use actual unique constraint name
          productId,
          modifierGroupId,
        },
      },
      data: updateData,
    });
  }

  async unlinkGroupFromProduct(
    tenantId: string,
    productId: string,
    modifierGroupId: string,
  ) {
    // Verify product belongs to tenant
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.productModifierGroup.delete({
      where: {
        product_modifier_groups_unique: { // Use actual unique constraint name
          productId,
          modifierGroupId,
        },
      },
    });

    return { success: true };
  }

  async getProductModifierGroups(tenantId: string, productId: string) {
    // Verify product belongs to tenant
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.productModifierGroup.findMany({
      where: {
        productId,
        isActive: true,
      },
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
    });
  }

  // Calculate price with modifiers
  calculateModifierPrice(basePrice: number, modifier: any): number {
    if (!modifier.priceChange) return basePrice;

    switch (modifier.priceType) { // Use schema field
      case 'add':
        return basePrice + modifier.priceChange;
      case 'replace':
        return modifier.priceChange;
      case 'multiply':
        return basePrice * modifier.priceChange;
      default:
        return basePrice;
    }
  }
}
