import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all locations for a tenant
   */
  async findAll(tenantId: string, includeInactive: boolean = false) {
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.location.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get location by ID
   */
  async findOne(tenantId: string, id: string) {
    const location = await this.prisma.location.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return location;
  }

  /**
   * Create a new location
   */
  async create(tenantId: string, dto: CreateLocationDto) {
    // Check tenant's location limit
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: { locations: { where: { deletedAt: null } } },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.maxLocations && tenant._count.locations >= tenant.maxLocations) {
      throw new ForbiddenException(
        `Location limit reached. Your plan allows ${tenant.maxLocations} locations. Please upgrade to add more.`,
      );
    }

    // Check if location name already exists for this tenant
    const existingLocation = await this.prisma.location.findFirst({
      where: {
        tenantId,
        name: dto.name,
        deletedAt: null,
      },
    });

    if (existingLocation) {
      throw new ConflictException('Location with this name already exists');
    }

    // Generate location code if not provided
    const code = dto.code || this.generateLocationCode(dto.name);

    return this.prisma.location.create({
      data: {
        tenantId,
        name: dto.name,
        code,
        locationType: dto.locationType || 'restaurant',
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        countryCode: dto.countryCode || tenant.countryCode,
        phone: dto.phone,
        email: dto.email,
        businessHours: dto.businessHours || {},
        timezone: dto.timezone || tenant.timezone,
        currencyCode: dto.currencyCode || tenant.currencyCode,
        taxSettings: dto.taxSettings || {},
        receiptSettings: dto.receiptSettings || {},
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Update location
   */
  async update(tenantId: string, id: string, dto: UpdateLocationDto) {
    const location = await this.prisma.location.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Check name uniqueness if name is being changed
    if (dto.name && dto.name !== location.name) {
      const existingLocation = await this.prisma.location.findFirst({
        where: {
          tenantId,
          name: dto.name,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (existingLocation) {
        throw new ConflictException('Location with this name already exists');
      }
    }

    return this.prisma.location.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete location (soft delete)
   */
  async remove(tenantId: string, id: string) {
    const location = await this.prisma.location.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Check if this is the last active location
    const activeLocationsCount = await this.prisma.location.count({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (activeLocationsCount <= 1) {
      throw new ForbiddenException(
        'Cannot delete the last location. At least one location is required.',
      );
    }

    return this.prisma.location.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  /**
   * Generate location code from name
   */
  private generateLocationCode(name: string): string {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10);
  }
}
