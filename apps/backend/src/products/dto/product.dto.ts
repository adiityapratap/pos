import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNumber,
  IsEnum,
  MaxLength,
  Min,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Transform empty strings and null to undefined for optional fields
const TransformEmptyToUndefined = () =>
  Transform(({ value }) => (value === '' || value === null ? undefined : value));

export enum ProductType {
  SIMPLE = 'simple',
  VARIANT = 'variant',
  COMBO = 'combo',
}

export class CreateProductDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  @TransformEmptyToUndefined()
  displayName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @TransformEmptyToUndefined()
  description?: string;

  @IsUUID()
  categoryId: string;

  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @IsUUID()
  @IsOptional()
  @TransformEmptyToUndefined()
  parentProductId?: string; // For variants

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @TransformEmptyToUndefined()
  cost?: number;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  @TransformEmptyToUndefined()
  sku?: string;

  @IsString()
  @IsOptional()
  @TransformEmptyToUndefined()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @IsNumber()
  @IsOptional()
  stockQuantity?: number;

  @IsNumber()
  @IsOptional()
  lowStockThreshold?: number;

  @IsObject()
  @IsOptional()
  metadata?: any;

  @IsArray()
  @IsOptional()
  tags?: string[];

  // Location fields
  @IsBoolean()
  @IsOptional()
  copyToAllLocations?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  locationIds?: string[];
}

export class UpdateProductDto {
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  @TransformEmptyToUndefined()
  displayName?: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  @TransformEmptyToUndefined()
  description?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @TransformEmptyToUndefined()
  cost?: number;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  @TransformEmptyToUndefined()
  sku?: string;

  @IsString()
  @IsOptional()
  @TransformEmptyToUndefined()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @IsNumber()
  @IsOptional()
  stockQuantity?: number;

  @IsNumber()
  @IsOptional()
  lowStockThreshold?: number;

  @IsObject()
  @IsOptional()
  metadata?: any;

  @IsArray()
  @IsOptional()
  tags?: string[];

  // Location fields
  @IsBoolean()
  @IsOptional()
  copyToAllLocations?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  locationIds?: string[];
}

export class CreateLocationPriceDto {
  @IsUUID()
  locationId: string;

  @IsNumber()
  @Min(0)
  price: number;
}

export class UpdateLocationPriceDto {
  @IsNumber()
  @Min(0)
  price: number;
}

export class ProductAvailabilityDto {
  @IsArray()
  @IsOptional()
  availableDays?: number[]; // 0-6 (Sunday-Saturday)

  @IsString()
  @IsOptional()
  availableTimeStart?: string; // HH:mm format

  @IsString()
  @IsOptional()
  availableTimeEnd?: string; // HH:mm format

  @IsArray()
  @IsOptional()
  unavailableDates?: Date[]; // Holiday overrides
}
