import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ComboItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsOptional()
  priceOverride?: number;

  @IsString()
  @IsOptional()
  selectionGroup?: string; // e.g., "main", "side", "drink"

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

// New DTO for creating combo from frontend (creates product + items)
export class CreateComboFromUIDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  displayName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  productIds: string[]; // Array of product IDs to include in combo

  // Location fields
  @IsBoolean()
  @IsOptional()
  copyToAllLocations?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  locationIds?: string[];
}

// Original DTO for adding items to existing combo product
export class CreateComboDto {
  @IsUUID()
  comboProductId: string; // The parent "combo" product

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComboItemDto)
  items: ComboItemDto[];

  // Location fields
  @IsBoolean()
  @IsOptional()
  copyToAllLocations?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  locationIds?: string[];
}

export class UpdateComboItemDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  priceOverride?: number;

  @IsString()
  @IsOptional()
  selectionGroup?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class AddComboItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsOptional()
  priceOverride?: number;

  @IsString()
  @IsOptional()
  selectionGroup?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
