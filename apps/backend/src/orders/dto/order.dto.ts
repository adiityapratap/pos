import { IsString, IsOptional, IsNumber, IsArray, IsBoolean, IsEnum, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export enum OrderStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  VOIDED = 'voided',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

export class OrderItemModifierDto {
  @IsString()
  modifierId: string;

  @IsString()
  @IsOptional()
  modifierGroupId?: string;

  @IsString()
  modifierName: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  quantity?: number;
}

export class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  itemName: string;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  lineTotal?: number;

  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemModifierDto)
  @IsOptional()
  modifiers?: OrderItemModifierDto[];
}

export class CreateOrderDto {
  @IsString()
  locationId: string;

  @IsEnum(OrderType)
  @IsOptional()
  orderType?: OrderType;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  tableNumber?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString()
  @IsOptional()
  customerNotes?: string;

  @IsString()
  @IsOptional()
  internalNotes?: string;

  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @IsNumber()
  @IsOptional()
  taxRate?: number;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  orderStatus: OrderStatus;

  @IsString()
  @IsOptional()
  voidReason?: string;
}

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsNumber()
  @IsOptional()
  amountPaid?: number;
}

export class OrderQueryDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  orderStatus?: OrderStatus;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsEnum(OrderType)
  @IsOptional()
  orderType?: OrderType;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  dateFrom?: string;

  @IsString()
  @IsOptional()
  dateTo?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}
