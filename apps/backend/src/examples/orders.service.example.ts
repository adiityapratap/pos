/**
 * Example Service: Orders
 * 
 * This demonstrates complex order creation with:
 * - Order items
 * - Modifiers
 * - Automatic total calculation
 * - Payment processing
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  specialInstructions?: string;
  modifiers?: {
    modifierId: string;
    modifierGroupId: string;
    quantity?: number;
  }[];
}

interface CreateOrderDto {
  tenantId: string;
  locationId: string;
  createdByUserId: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery' | 'drive_thru';
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  items: CreateOrderItemDto[];
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new order with items and modifiers
   */
  async create(data: CreateOrderDto) {
    // Generate order number
    const orderNumber = await this.generateOrderNumber(
      data.tenantId,
      data.locationId,
    );

    // Calculate order totals
    const { items, subtotal, taxAmount, totalAmount } =
      await this.calculateOrderTotals(data.tenantId, data.items);

    // Create order with transaction
    return this.prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          tenantId: data.tenantId,
          locationId: data.locationId,
          orderNumber,
          orderType: data.orderType,
          orderSource: 'pos',
          createdByUserId: data.createdByUserId,
          customerId: data.customerId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          tableNumber: data.tableNumber,
          subtotal,
          taxAmount,
          totalAmount,
          amountDue: totalAmount,
          orderStatus: 'pending',
          paymentStatus: 'unpaid',
        },
      });

      // Create order items with modifiers
      for (const item of items) {
        const orderItem = await tx.orderItem.create({
          data: {
            tenantId: data.tenantId,
            orderId: order.id,
            productId: item.productId,
            itemName: item.itemName,
            itemSku: item.itemSku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            lineTotal: item.lineTotal,
            specialInstructions: item.specialInstructions,
            kitchenStation: item.kitchenStation,
            prepStatus: 'pending',
          },
        });

        // Add modifiers
        if (item.modifiers && item.modifiers.length > 0) {
          await tx.orderItemModifier.createMany({
            data: item.modifiers.map((mod) => ({
              tenantId: data.tenantId,
              orderItemId: orderItem.id,
              modifierId: mod.modifierId,
              modifierGroupId: mod.modifierGroupId,
              modifierName: mod.modifierName,
              modifierPrice: mod.modifierPrice,
              quantity: mod.quantity || 1,
            })),
          });
        }
      }

      // Return complete order
      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          orderItems: {
            include: {
              modifiers: {
                include: {
                  modifier: true,
                  modifierGroup: true,
                },
              },
            },
          },
          location: true,
          createdByUser: true,
        },
      });
    });
  }

  /**
   * Get order by ID
   */
  async findOne(id: string, tenantId: string) {
    return this.prisma.order.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        orderItems: {
          include: {
            product: true,
            modifiers: {
              include: {
                modifier: true,
                modifierGroup: true,
              },
            },
          },
        },
        payments: true,
        customer: true,
        location: true,
        createdByUser: true,
        cashierUser: true,
      },
    });
  }

  /**
   * Get today's orders for a location
   */
  async getTodaysOrders(tenantId: string, locationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.order.findMany({
      where: {
        tenantId,
        locationId,
        createdAt: { gte: today },
        deletedAt: null,
      },
      include: {
        orderItems: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Process payment for an order
   */
  async processPayment(
    orderId: string,
    tenantId: string,
    paymentData: {
      paymentMethod: string;
      amount: number;
      processedByUserId: string;
      cashTendered?: number;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Get order
      const order = await tx.order.findFirst({
        where: { id: orderId, tenantId },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Calculate change for cash payments
      let cashChange: number | undefined;
      if (
        paymentData.paymentMethod === 'cash' &&
        paymentData.cashTendered
      ) {
        cashChange = paymentData.cashTendered - paymentData.amount;
      }

      // Create payment
      const payment = await tx.payment.create({
        data: {
          tenantId,
          orderId,
          paymentMethod: paymentData.paymentMethod,
          amount: paymentData.amount,
          cashTendered: paymentData.cashTendered,
          cashChange,
          paymentStatus: 'captured',
          processedByUserId: paymentData.processedByUserId,
          capturedAt: new Date(),
        },
      });

      // Update order
      const amountPaid = order.amountPaid.toNumber() + paymentData.amount;
      const amountDue = order.totalAmount.toNumber() - amountPaid;

      const paymentStatus =
        amountDue <= 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';

      const orderStatus =
        paymentStatus === 'paid' ? 'confirmed' : order.orderStatus;

      await tx.order.update({
        where: { id: orderId },
        data: {
          amountPaid,
          amountDue,
          paymentStatus,
          orderStatus,
          sentToKitchenAt:
            orderStatus === 'confirmed' ? new Date() : undefined,
        },
      });

      return payment;
    });
  }

  /**
   * Update order status
   */
  async updateStatus(
    orderId: string,
    tenantId: string,
    status: string,
  ) {
    return this.prisma.order.update({
      where: { id: orderId, tenantId },
      data: {
        orderStatus: status,
        ...(status === 'completed' && { completedAt: new Date() }),
        ...(status === 'preparing' && {
          sentToKitchenAt: new Date(),
        }),
      },
    });
  }

  /**
   * Void an order
   */
  async voidOrder(
    orderId: string,
    tenantId: string,
    voidReason: string,
    voidedByUserId: string,
  ) {
    return this.prisma.order.update({
      where: { id: orderId, tenantId },
      data: {
        orderStatus: 'cancelled',
        paymentStatus: 'void',
        voidedAt: new Date(),
        voidReason,
        voidedByUserId,
      },
    });
  }

  /**
   * Generate order number
   */
  private async generateOrderNumber(
    tenantId: string,
    locationId: string,
  ): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await this.prisma.order.count({
      where: {
        tenantId,
        locationId,
        createdAt: { gte: today },
      },
    });

    return String(count + 1).padStart(4, '0');
  }

  /**
   * Calculate order totals
   */
  private async calculateOrderTotals(
    tenantId: string,
    items: CreateOrderItemDto[],
  ) {
    let subtotal = 0;
    let taxAmount = 0;
    const processedItems: any[] = [];

    for (const item of items) {
      // Get product details
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, tenantId },
      });

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      // Calculate base price
      let itemPrice = product.basePrice.toNumber();

      // Add modifier prices
      const modifiers: any[] = [];
      if (item.modifiers) {
        for (const mod of item.modifiers) {
          const modifier = await this.prisma.modifier.findFirst({
            where: { id: mod.modifierId, tenantId },
          });

          if (modifier) {
            itemPrice += modifier.priceChange.toNumber();
            modifiers.push({
              modifierId: mod.modifierId,
              modifierGroupId: mod.modifierGroupId,
              modifierName: modifier.name,
              modifierPrice: modifier.priceChange.toNumber(),
              quantity: mod.quantity || 1,
            });
          }
        }
      }

      // Calculate line total
      const quantity = item.quantity;
      const lineSubtotal = itemPrice * quantity;
      const taxRate = product.taxRate?.toNumber() || 0;
      const lineTax = lineSubtotal * taxRate;
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      processedItems.push({
        productId: item.productId,
        itemName: product.name,
        itemSku: product.sku,
        quantity,
        unitPrice: itemPrice,
        taxRate,
        taxAmount: lineTax,
        lineTotal,
        specialInstructions: item.specialInstructions,
        kitchenStation: product.kitchenStation,
        modifiers,
      });
    }

    return {
      items: processedItems,
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
    };
  }
}
