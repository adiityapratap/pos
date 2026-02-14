import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCategoryDto) {
    // If parentId is provided, verify it exists and belongs to same tenant
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: {
          id: dto.parentId,
          tenantId,
          deletedAt: null,
        },
      });

      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    // If parentCategoryIds provided, verify they all exist
    if (dto.parentCategoryIds && dto.parentCategoryIds.length > 0) {
      const parents = await this.prisma.category.findMany({
        where: {
          id: { in: dto.parentCategoryIds },
          tenantId,
          deletedAt: null,
        },
      });

      if (parents.length !== dto.parentCategoryIds.length) {
        throw new BadRequestException('One or more parent categories not found');
      }
    }

    // Create category and relationships in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Extract fields that aren't part of the Category model
      const { parentCategoryIds, copyToAllLocations, locationIds, ...categoryData } = dto;

      // Create the category
      const category = await tx.category.create({
        data: {
          ...categoryData,
          tenantId,
          sortOrder: categoryData.sortOrder ?? 0,
          isActive: categoryData.isActive ?? true,
        },
      });

      // Create junction table entries if parentCategoryIds provided
      if (parentCategoryIds && parentCategoryIds.length > 0) {
        await tx.categoryRelationship.createMany({
          data: parentCategoryIds.map((parentId, index) => ({
            tenantId,
            parentCategoryId: parentId,
            subcategoryId: category.id,
            sortOrder: index,
          })),
        });
      }

      // Create category-location associations if locationIds provided
      if (locationIds && locationIds.length > 0) {
        await tx.categoryLocation.createMany({
          data: locationIds.map((locId, index) => ({
            tenantId,
            categoryId: category.id,
            locationId: locId,
            sortOrder: index,
          })),
        });
      }

      return category;
    });
  }

  async findAll(tenantId: string, includeInactive = false) {
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    const categories = await this.prisma.category.findMany({
      where,
      include: {
        // Use subcategoryRelationships to get relationships where THIS category is the subcategory
        // This tells us what parents THIS category has
        subcategoryRelationships: {
          include: {
            parentCategory: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    // Add parentIds array to each category (from relationships where this category is the child)
    return categories.map(cat => ({
      ...cat,
      parentIds: cat.subcategoryRelationships.map(rel => rel.parentCategoryId),
    }));
  }

  async findSubcategories(tenantId: string) {
    // Get all category relationships to find subcategories
    const relationships = await this.prisma.categoryRelationship.findMany({
      where: {
        tenantId,
      },
      include: {
        subcategory: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
      ],
    });

    // Return subcategories with their parent ID
    return relationships.map(rel => ({
      id: rel.subcategory.id,
      name: rel.subcategory.name,
      displayName: rel.subcategory.displayName,
      parentId: rel.parentCategoryId,
      sortOrder: rel.sortOrder,
    }));
  }

  async findOne(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findTree(tenantId: string, includeInactive = false, includeProducts = false) {
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    const allCategories = await this.prisma.category.findMany({
      where,
      include: includeProducts ? {
        products: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          include: {
            modifierGroups: { // Match schema relation name
              include: {
                modifierGroup: true,
              },
            },
          },
        },
      } : undefined,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    // Build tree structure
    const categoryMap = new Map<string, any>();
    const rootCategories: any[] = [];

    // First pass: Create map with explicit fields to ensure parentId is included
    allCategories.forEach(cat => {
      categoryMap.set(cat.id, {
        id: cat.id,
        tenantId: cat.tenantId,
        parentId: cat.parentId,
        name: cat.name,
        displayName: cat.displayName,
        description: cat.description,
        sortOrder: cat.sortOrder,
        colorHex: cat.colorHex,
        iconUrl: cat.iconUrl,
        imageUrl: cat.imageUrl,
        isActive: cat.isActive,
        availableDays: cat.availableDays,
        availableFrom: cat.availableFrom,
        availableTo: cat.availableTo,
        metadata: cat.metadata,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        products: (cat as any).products || [],
        children: []
      });
    });

    // Second pass: Build hierarchy
    allCategories.forEach(cat => {
      const categoryNode = categoryMap.get(cat.id);
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId).children.push(categoryNode);
      } else {
        rootCategories.push(categoryNode);
      }
    });

    return rootCategories;
  }

  async update(tenantId: string, id: string, dto: UpdateCategoryDto) {
    await this.findOne(tenantId, id); // Verify exists

    // If changing parent, verify new parent exists
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: {
          id: dto.parentId,
          tenantId,
          deletedAt: null,
        },
      });

      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }

      // Prevent circular reference
      if (dto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
    }

    // If parentCategoryIds provided, verify they all exist
    if (dto.parentCategoryIds) {
      const parents = await this.prisma.category.findMany({
        where: {
          id: { in: dto.parentCategoryIds },
          tenantId,
          deletedAt: null,
        },
      });

      if (parents.length !== dto.parentCategoryIds.length) {
        throw new BadRequestException('One or more parent categories not found');
      }
    }

    // Update category and relationships in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Extract fields that aren't part of the Category model
      const { parentCategoryIds, copyToAllLocations, locationIds, ...categoryData } = dto;

      // Update the category
      const category = await tx.category.update({
        where: { id },
        data: categoryData,
      });

      // Update junction table entries if parentCategoryIds provided
      if (parentCategoryIds !== undefined) {
        // Delete existing relationships
        await tx.categoryRelationship.deleteMany({
          where: {
            subcategoryId: id,
            tenantId,
          },
        });

        // Create new relationships
        if (parentCategoryIds.length > 0) {
          await tx.categoryRelationship.createMany({
            data: parentCategoryIds.map((parentId, index) => ({
              tenantId,
              parentCategoryId: parentId,
              subcategoryId: id,
              sortOrder: index,
            })),
          });
        }
      }

      return category;
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id); // Verify exists

    // Soft delete
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async bulkUpdateSortOrder(tenantId: string, updates: Array<{ id: string; sortOrder: number }>) {
    // Verify all categories belong to tenant
    const ids = updates.map(u => u.id);
    const categories = await this.prisma.category.findMany({
      where: {
        id: { in: ids },
        tenantId,
        deletedAt: null,
      },
    });

    if (categories.length !== ids.length) {
      throw new BadRequestException('One or more categories not found');
    }

    // Update in transaction
    await this.prisma.$transaction(
      updates.map(update =>
        this.prisma.category.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        })
      )
    );

    return { success: true };
  }
}
