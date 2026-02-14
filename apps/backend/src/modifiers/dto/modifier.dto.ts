import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  MaxLength,
  Min,
  Max,
  IsUUID,
  IsArray,
} from 'class-validator';

export enum PriceChangeType {
  ADD = 'add',
  REPLACE = 'replace',
  MULTIPLY = 'multiply',
}

// Modifier Group DTOs
export class CreateModifierGroupDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  displayName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  shortName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  selectionType?: string;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minSelections?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxSelections?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Location fields
  @IsBoolean()
  @IsOptional()
  copyToAllLocations?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  locationIds?: string[];
}

export class UpdateModifierGroupDto {
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minSelections?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxSelections?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Location fields
  @IsBoolean()
  @IsOptional()
  copyToAllLocations?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  locationIds?: string[];
}

// Modifier DTOs
export class CreateModifierDto {
  @IsUUID()
  modifierGroupId: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  displayName?: string;

  @IsEnum(PriceChangeType)
  @IsOptional()
  priceChangeType?: PriceChangeType;

  @IsNumber()
  @IsOptional()
  priceChange?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  stockQuantity?: number;

  @IsBoolean()
  @IsOptional()
  trackStock?: boolean;

  // Location fields
  @IsBoolean()
  @IsOptional()
  copyToAllLocations?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  locationIds?: string[];
}

export class UpdateModifierDto {
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  displayName?: string;

  @IsEnum(PriceChangeType)
  @IsOptional()
  priceChangeType?: PriceChangeType;

  @IsNumber()
  @IsOptional()
  priceChange?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  stockQuantity?: number;

  @IsBoolean()
  @IsOptional()
  trackStock?: boolean;

  // Location fields
  @IsBoolean()
  @IsOptional()
  copyToAllLocations?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  locationIds?: string[];
}

// Product Modifier Group Mapping DTOs
export class LinkModifierGroupDto {
  @IsUUID()
  modifierGroupId: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minSelections?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxSelections?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  excludedModifierIds?: string[];
}

export class UpdateProductModifierGroupDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minSelections?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxSelections?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  excludedModifierIds?: string[];
}
