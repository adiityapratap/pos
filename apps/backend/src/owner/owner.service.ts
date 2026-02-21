import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantQueryDto,
  CreateTenantLocationDto,
  UpdateTenantLocationDto,
  CreateTenantUserDto,
  UpdateTenantUserDto,
  ResetUserPasswordDto,
} from './dto/tenant.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OwnerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all tenants with pagination and filters
   */
  async findAllTenants(query: TenantQueryDto) {
    const { search, status, plan, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: {
      deletedAt: null;
      OR?: Array<
        | { businessName?: { contains: string; mode: 'insensitive' } }
        | { subdomain?: { contains: string; mode: 'insensitive' } }
      >;
      subscriptionStatus?: string;
      planType?: string;
    } = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.subscriptionStatus = status;
    }

    if (plan) {
      where.planType = plan;
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              locations: true,
              users: true,
              products: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    // Transform to include counts
    const tenantsWithStats = tenants.map((tenant) => ({
      id: tenant.id,
      businessName: tenant.businessName,
      subdomain: tenant.subdomain,
      legalEntityName: tenant.legalEntityName,
      planType: tenant.planType,
      subscriptionStatus: tenant.subscriptionStatus,
      subscriptionStartedAt: tenant.subscriptionStartedAt,
      subscriptionEndsAt: tenant.subscriptionEndsAt,
      trialEndsAt: tenant.trialEndsAt,
      currencyCode: tenant.currencyCode,
      timezone: tenant.timezone,
      countryCode: tenant.countryCode,
      maxLocations: tenant.maxLocations,
      maxUsers: tenant.maxUsers,
      maxProducts: tenant.maxProducts,
      features: tenant.features,
      isActive: tenant.isActive,
      isLocked: tenant.isLocked,
      lockedReason: tenant.lockedReason,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      // Stats
      locationsCount: tenant._count.locations,
      usersCount: tenant._count.users,
      productsCount: tenant._count.products,
    }));

    return {
      data: tenantsWithStats,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get tenant by ID with full details
   */
  async findTenantById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        locations: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            employeeCode: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            products: true,
            categories: true,
            orders: true,
          },
        },
      },
    });

    if (!tenant || tenant.deletedAt) {
      throw new NotFoundException('Tenant not found');
    }

    return {
      ...tenant,
      productsCount: tenant._count.products,
      categoriesCount: tenant._count.categories,
      ordersCount: tenant._count.orders,
    };
  }

  /**
   * Create a new tenant with admin user
   */
  async createTenant(dto: CreateTenantDto) {
    // Check if subdomain already exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { subdomain: dto.subdomain },
    });

    if (existingTenant) {
      throw new ConflictException('Subdomain already exists');
    }

    // Check if admin email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.adminEmail.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Admin email already registered');
    }

    // Hash admin password
    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create tenant with admin user and default location in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          businessName: dto.businessName,
          subdomain: dto.subdomain.toLowerCase(),
          legalEntityName: dto.legalEntityName,
          planType: dto.planType || 'starter',
          subscriptionStatus: 'trial',
          trialEndsAt,
          countryCode: dto.countryCode || 'US',
          currencyCode: dto.currencyCode || 'USD',
          timezone: dto.timezone || 'UTC',
          maxLocations: dto.maxLocations || 1,
          maxUsers: dto.maxUsers || 5,
          maxProducts: dto.maxProducts || 100,
          features: {
            kds: false,
            loyalty: false,
            analytics: true,
          },
        },
      });

      // Create default location
      const location = await tx.location.create({
        data: {
          tenantId: tenant.id,
          name: 'Main Location',
          code: 'MAIN',
          locationType: 'restaurant',
          countryCode: dto.countryCode || 'US',
          currencyCode: dto.currencyCode || 'USD',
          timezone: dto.timezone || 'UTC',
          isActive: true,
        },
      });

      // Create admin user
      const admin = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.adminEmail.toLowerCase(),
          passwordHash,
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
          displayName: `${dto.adminFirstName} ${dto.adminLastName}`,
          role: 'owner',
          employeeCode: 'EMP-001',
          isActive: true,
          allowedLocations: [location.id],
        },
      });

      return { tenant, location, admin };
    });

    return {
      id: result.tenant.id,
      businessName: result.tenant.businessName,
      subdomain: result.tenant.subdomain,
      planType: result.tenant.planType,
      subscriptionStatus: result.tenant.subscriptionStatus,
      trialEndsAt: result.tenant.trialEndsAt,
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        name: `${result.admin.firstName} ${result.admin.lastName}`,
      },
      location: {
        id: result.location.id,
        name: result.location.name,
      },
      createdAt: result.tenant.createdAt,
    };
  }

  /**
   * Update tenant details
   */
  async updateTenant(id: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant || tenant.deletedAt) {
      throw new NotFoundException('Tenant not found');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Suspend a tenant
   */
  async suspendTenant(id: string, reason: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant || tenant.deletedAt) {
      throw new NotFoundException('Tenant not found');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: {
        subscriptionStatus: 'suspended',
        isLocked: true,
        lockedReason: reason,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Activate/reactivate a tenant
   */
  async activateTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant || tenant.deletedAt) {
      throw new NotFoundException('Tenant not found');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: {
        subscriptionStatus: 'active',
        isActive: true,
        isLocked: false,
        lockedReason: null,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete a tenant
   */
  async deleteTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant || tenant.deletedAt) {
      throw new NotFoundException('Tenant not found');
    }

    // Soft delete tenant and all its users
    await this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
          subdomain: `deleted-${tenant.subdomain}-${Date.now()}`, // Free up subdomain
        },
      }),
      this.prisma.user.updateMany({
        where: { tenantId: id },
        data: { deletedAt: new Date(), isActive: false },
      }),
    ]);

    return { success: true, message: 'Tenant deleted successfully' };
  }

  /**
   * Get dashboard stats for owner portal
   */
  async getDashboardStats() {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      totalLocations,
      totalUsers,
      recentTenants,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.tenant.count({
        where: { subscriptionStatus: 'active', deletedAt: null },
      }),
      this.prisma.tenant.count({
        where: { subscriptionStatus: 'trial', deletedAt: null },
      }),
      this.prisma.tenant.count({
        where: { subscriptionStatus: 'suspended', deletedAt: null },
      }),
      this.prisma.location.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          businessName: true,
          subdomain: true,
          planType: true,
          subscriptionStatus: true,
          createdAt: true,
        },
      }),
    ]);

    // Plan distribution
    const planDistribution = await this.prisma.tenant.groupBy({
      by: ['planType'],
      where: { deletedAt: null },
      _count: { _all: true },
    });

    return {
      overview: {
        totalTenants,
        activeTenants,
        trialTenants,
        suspendedTenants,
        totalLocations,
        totalUsers,
      },
      planDistribution: planDistribution.map((p) => ({
        plan: p.planType,
        count: p._count._all,
      })),
      recentTenants,
    };
  }

  // ==========================================
  // TENANT LOCATION MANAGEMENT
  // ==========================================

  /**
   * Get all locations for a tenant
   */
  async getTenantLocations(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || tenant.deletedAt) {
      throw new NotFoundException('Tenant not found');
    }

    return this.prisma.location.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Add a location to a tenant
   */
  async addLocationToTenant(tenantId: string, dto: CreateTenantLocationDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: { select: { locations: { where: { deletedAt: null } } } },
      },
    });

    if (!tenant || tenant.deletedAt) {
      throw new NotFoundException('Tenant not found');
    }

    // Check location limit
    if (tenant.maxLocations && tenant._count.locations >= tenant.maxLocations) {
      throw new BadRequestException(
        `Tenant has reached maximum locations limit (${tenant.maxLocations}). Please upgrade the plan.`,
      );
    }

    // Generate code if not provided
    const code =
      dto.code || `LOC-${String(tenant._count.locations + 1).padStart(3, '0')}`;

    return this.prisma.location.create({
      data: {
        tenantId,
        name: dto.name,
        code,
        locationType: dto.locationType || 'store',
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        countryCode: dto.countryCode || tenant.countryCode,
        phone: dto.phone,
        email: dto.email,
        timezone: dto.timezone || tenant.timezone,
        taxSettings: dto.taxRate ? { defaultRate: dto.taxRate } : {},
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Update a location for a tenant
   */
  async updateTenantLocation(
    tenantId: string,
    locationId: string,
    dto: UpdateTenantLocationDto,
  ) {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, tenantId, deletedAt: null },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Handle taxRate separately since it's stored in taxSettings
    const { taxRate, ...restDto } = dto;
    const updateData: Record<string, unknown> = {
      ...restDto,
      updatedAt: new Date(),
    };

    if (taxRate !== undefined) {
      updateData.taxSettings = { defaultRate: taxRate };
    }

    return this.prisma.location.update({
      where: { id: locationId },
      data: updateData,
    });
  }

  /**
   * Delete a location for a tenant
   */
  async deleteTenantLocation(tenantId: string, locationId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, tenantId, deletedAt: null },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Check if this is the last location
    const locationCount = await this.prisma.location.count({
      where: { tenantId, deletedAt: null },
    });

    if (locationCount <= 1) {
      throw new BadRequestException('Cannot delete the last location');
    }

    return this.prisma.location.update({
      where: { id: locationId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // ==========================================
  // TENANT USER MANAGEMENT
  // ==========================================

  /**
   * Get all users for a tenant
   */
  async getTenantUsers(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || tenant.deletedAt) {
      throw new NotFoundException('Tenant not found');
    }

    return this.prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        employeeCode: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        allowedLocations: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Add a user to a tenant
   */
  async addUserToTenant(tenantId: string, dto: CreateTenantUserDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: { select: { users: { where: { deletedAt: null } } } },
      },
    });

    if (!tenant || tenant.deletedAt) {
      throw new NotFoundException('Tenant not found');
    }

    // Check user limit
    if (tenant.maxUsers && tenant._count.users >= tenant.maxUsers) {
      throw new BadRequestException(
        `Tenant has reached maximum users limit (${tenant.maxUsers}). Please upgrade the plan.`,
      );
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), tenantId },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Hash PIN if provided
    let pinCodeHash: string | null = null;
    if (dto.pin) {
      pinCodeHash = await bcrypt.hash(dto.pin, 10);
    }

    // Generate employee code if not provided
    const employeeCode =
      dto.employeeCode ||
      `EMP-${String(tenant._count.users + 1).padStart(3, '0')}`;

    return this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email.toLowerCase(),
        passwordHash,
        pinCodeHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        displayName: `${dto.firstName} ${dto.lastName}`,
        employeeCode,
        role: dto.role || 'cashier',
        isActive: dto.isActive ?? true,
        allowedLocations: dto.allowedLocations || [],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        employeeCode: true,
        role: true,
        isActive: true,
        allowedLocations: true,
        createdAt: true,
      },
    });
  }

  /**
   * Update a user for a tenant
   */
  async updateTenantUser(
    tenantId: string,
    userId: string,
    dto: UpdateTenantUserDto,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new PIN if provided
    let pinCodeHash: string | null | undefined = undefined;
    if (dto.pin !== undefined) {
      pinCodeHash = dto.pin ? await bcrypt.hash(dto.pin, 10) : null;
    }

    const updateData: Record<string, unknown> = {
      ...dto,
      updatedAt: new Date(),
    };

    if (dto.firstName || dto.lastName) {
      updateData.displayName = `${dto.firstName || user.firstName} ${dto.lastName || user.lastName}`;
    }

    if (pinCodeHash !== undefined) {
      updateData.pinCodeHash = pinCodeHash;
      delete updateData.pin;
    } else {
      delete updateData.pin;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        employeeCode: true,
        role: true,
        isActive: true,
        allowedLocations: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Reset password for a tenant user
   */
  async resetTenantUserPassword(
    tenantId: string,
    userId: string,
    dto: ResetUserPasswordDto,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, updatedAt: new Date() },
    });

    return { success: true, message: 'Password reset successfully' };
  }

  /**
   * Delete a user from a tenant
   */
  async deleteTenantUser(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deleting the last owner
    if (user.role === 'owner') {
      const ownerCount = await this.prisma.user.count({
        where: { tenantId, role: 'owner', deletedAt: null },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot delete the last owner');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  /**
   * Get tenant theme settings
   */
  async getTenantTheme(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        businessName: true,
        metadata: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const metadata = tenant.metadata as Record<string, any> || {};
    const theme = metadata.theme || {};

    return {
      tenantId: tenant.id,
      businessName: tenant.businessName,
      primaryColor: theme.primaryColor || '#2563eb',
    };
  }

  /**
   * Update tenant theme settings
   */
  async updateTenantTheme(tenantId: string, primaryColor: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { metadata: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Validate hex color format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(primaryColor)) {
      throw new BadRequestException('Invalid color format. Use hex format (e.g., #2563eb)');
    }

    // Merge existing metadata with new theme
    const existingMetadata = tenant.metadata as Record<string, any> || {};
    const updatedMetadata = {
      ...existingMetadata,
      theme: {
        ...(existingMetadata.theme || {}),
        primaryColor,
      },
    };

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        metadata: updatedMetadata,
        updatedAt: new Date(),
      },
    });

    return {
      tenantId: updated.id,
      primaryColor,
      message: 'Theme updated successfully',
    };
  }
}
