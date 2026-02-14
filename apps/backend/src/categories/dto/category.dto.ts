import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
  MaxLength,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Transform empty strings to undefined for optional fields
const TransformEmptyToUndefined = () =>
  Transform(({ value }) => (value === '' ? undefined : value));

export class CreateCategoryDto {
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

  @IsUUID('4', { message: 'parentId must be a valid UUID' })
  @IsOptional()
  @TransformEmptyToUndefined()
  parentId?: string | null;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  parentCategoryIds?: string[];

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  colorHex?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  // Location fields
  @IsBoolean()
  @IsOptional()
  copyToAllLocations?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  locationIds?: string[];
}

export class UpdateCategoryDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  displayName?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @IsUUID('4', { message: 'parentId must be a valid UUID' })
  @IsOptional()
  @TransformEmptyToUndefined()
  parentId?: string | null;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  parentCategoryIds?: string[];

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  colorHex?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  // Location fields
  @IsBoolean()
  @IsOptional()
  copyToAllLocations?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  locationIds?: string[];
}

export class CategoryResponseDto {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  children?: CategoryResponseDto[];
  products?: any[];
}
