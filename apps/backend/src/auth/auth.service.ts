import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  tenantId: string;
  role: string;
  locationIds: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Authenticate user with PIN code (for POS terminals)
   */
  async validatePin(
    employeeId: string,
    pin: string,
    tenantSubdomain: string,
  ): Promise<any> {
    // Get tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain: tenantSubdomain },
    });

    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Invalid tenant');
    }

    // Find user by employee code or email
    const user = await this.prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          { employeeCode: employeeId },
          { email: employeeId },
        ],
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isLocked) {
      throw new ForbiddenException('Account is locked. Please contact administrator');
    }

    // Verify PIN
    if (!user.pinCodeHash) {
      throw new UnauthorizedException('PIN not set for this user');
    }

    const isPinValid = await bcrypt.compare(pin, user.pinCodeHash);

    if (!isPinValid) {
      // Increment failed login attempts
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: {
            increment: 1,
          },
          // Lock account after 5 failed attempts
          isLocked: user.failedLoginAttempts >= 4,
        },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts and update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    });

    return this.generateTokenResponse(user, tenant);
  }

  /**
   * Authenticate user with email and password (for web dashboard)
   */
  async validateEmailPassword(
    email: string,
    password: string,
    tenantSubdomain: string,
  ): Promise<any> {
    // Get tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain: tenantSubdomain },
    });

    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Invalid tenant');
    }

    // Find user
    const user = await this.prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email: email.toLowerCase(),
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isLocked) {
      throw new ForbiddenException('Account is locked. Please contact administrator');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: {
            increment: 1,
          },
          isLocked: user.failedLoginAttempts >= 4,
        },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts and update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    });

    return this.generateTokenResponse(user, tenant);
  }

  /**
   * Generate JWT token response
   */
  private generateTokenResponse(user: any, tenant: any) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      locationIds: user.allowedLocations || [],
    };

    // Explicitly set expiresIn to avoid env var issues in production
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const accessToken = this.jwtService.sign(payload, { expiresIn });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName || `${user.firstName} ${user.lastName}`,
        role: user.role,
        employeeCode: user.employeeCode,
        allowedLocations: user.allowedLocations,
        permissions: user.permissions,
      },
      tenant: {
        id: tenant.id,
        businessName: tenant.businessName,
        subdomain: tenant.subdomain,
        planType: tenant.planType,
        features: tenant.features,
      },
    };
  }

  /**
   * Owner/Super Admin login (no tenant required)
   * Allows owners to access the Owner Portal across all tenants
   */
  async validateOwnerLogin(email: string, password: string): Promise<any> {
    // Find user with owner role across all tenants
    const user = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        role: 'owner',
        isActive: true,
        deletedAt: null,
      },
      include: {
        tenant: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isLocked) {
      throw new ForbiddenException('Account is locked. Please contact administrator');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          isLocked: user.failedLoginAttempts >= 4,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts and update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    });

    // Generate owner token with special payload
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: 'owner',
      isOwner: true,
      locationIds: [],
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName || `${user.firstName} ${user.lastName}`,
        role: user.role,
      },
    };
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Hash PIN
   */
  async hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, 10);
  }

  /**
   * Validate JWT payload
   */
  async validateJwtPayload(payload: JwtPayload): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        tenantId: payload.tenantId,
        isActive: true,
        isLocked: false,
        deletedAt: null,
      },
      include: {
        tenant: true,
      },
    });

    if (!user || !user.tenant.isActive) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      locationIds: user.allowedLocations,
      permissions: user.permissions,
      tenant: user.tenant,
    };
  }
}
