import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export enum PlanType {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  businessName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'Subdomain must contain only lowercase letters, numbers, and hyphens',
  })
  subdomain: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  legalEntityName?: string;

  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  adminPassword: string;

  @IsString()
  @IsNotEmpty()
  adminFirstName: string;

  @IsString()
  @IsNotEmpty()
  adminLastName: string;

  @IsEnum(PlanType)
  @IsOptional()
  planType?: PlanType = PlanType.STARTER;

  @IsString()
  @IsOptional()
  @MaxLength(2)
  countryCode?: string = 'US';

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currencyCode?: string = 'USD';

  @IsString()
  @IsOptional()
  @MaxLength(100)
  timezone?: string = 'UTC';

  @IsInt()
  @IsOptional()
  @Min(1)
  maxLocations?: number = 1;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxUsers?: number = 5;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxProducts?: number = 100;
}

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  businessName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  legalEntityName?: string;

  @IsEnum(PlanType)
  @IsOptional()
  planType?: PlanType;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  subscriptionStatus?: SubscriptionStatus;

  @IsString()
  @IsOptional()
  @MaxLength(2)
  countryCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currencyCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  timezone?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxLocations?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxUsers?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxProducts?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;

  @IsString()
  @IsOptional()
  lockedReason?: string;
}

export class TenantQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsEnum(PlanType)
  @IsOptional()
  plan?: PlanType;

  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @IsInt()
  @IsOptional()
  @Min(1)
  limit?: number = 20;
}

// DTOs for managing tenant locations as owner
export class CreateTenantLocationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @IsString()
  @IsOptional()
  locationType?: string = 'store';

  @IsString()
  @IsOptional()
  addressLine1?: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2)
  countryCode?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsOptional()
  taxRate?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

export class UpdateTenantLocationDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @IsString()
  @IsOptional()
  locationType?: string;

  @IsString()
  @IsOptional()
  addressLine1?: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2)
  countryCode?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsOptional()
  taxRate?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// DTOs for managing tenant users as owner
export class CreateTenantUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  employeeCode?: string;

  @IsString()
  @IsOptional()
  role?: string = 'cashier';

  @IsString()
  @IsOptional()
  pin?: string;

  @IsOptional()
  allowedLocations?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

export class UpdateTenantUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  employeeCode?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  pin?: string;

  @IsOptional()
  allowedLocations?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ResetUserPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
