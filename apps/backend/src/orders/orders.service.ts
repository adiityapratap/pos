import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { 
  CreateOrderDto, 
  UpdateOrderStatusDto, 
  UpdatePaymentStatusDto,
  OrderQueryDto,
  OrderStatus,
  PaymentStatus 
} from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreateOrderDto) {
    // Generate order number
    const orderCount = await this.prisma.order.count({
      where: { tenantId, locationId: dto.locationId },
    });
    const orderNumber = `ORD-${String(orderCount + 1).padStart(5, '0')}`;
    const displayNumber = `#${10000 + orderCount + 1}`;

    // Calculate totals
    let subtotal = 0;
    const itemsData = dto.items.map((item, index) => {
      const lineTotal = item.lineTotal ?? (item.unitPrice * (item.quantity ?? 1));
      subtotal += lineTotal;
      return {
        tenantId,
        productId: item.productId,
        itemName: item.itemName,
        unitPrice: item.unitPrice,
        quantity: item.quantity ?? 1,
        lineTotal,
        specialInstructions: item.specialInstructions,
        sortOrder: index,
      };
    });

    const taxRate = dto.taxRate ?? 0.08;
    const taxAmount = subtotal * taxRate;
    const discountAmount = dto.discountAmount ?? 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    return this.prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          tenantId,
          locationId: dto.locationId,
          orderNumber,
          displayNumber,
          orderType: dto.orderType ?? 'dine_in',
          orderSource: 'pos',
          customerId: dto.customerId,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          tableNumber: dto.tableNumber,
          createdByUserId: userId,
          cashierUserId: userId,
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          amountDue: totalAmount,
          orderStatus: 'open',
          paymentStatus: 'unpaid',
          customerNotes: dto.customerNotes,
          internalNotes: dto.internalNotes,
        },
      });

      // Create order items
      for (const itemData of itemsData) {
        const orderItem = await tx.orderItem.create({
          data: {
            ...itemData,
            orderId: order.id,
          },
        });

        // Create modifiers if any
        const originalItem = dto.items.find(i => i.productId === itemData.productId);
        if (originalItem?.modifiers && originalItem.modifiers.length > 0) {
          // For each modifier, look up its modifierGroupId if not provided
          const modifierData = await Promise.all(
            originalItem.modifiers.map(async (mod) => {
              let modifierGroupId = mod.modifierGroupId;
              
              // Look up modifierGroupId (groupId in Modifier table) if not provided
              if (!modifierGroupId) {
                const modifier = await tx.modifier.findUnique({
                  where: { id: mod.modifierId },
                  select: { groupId: true },
                });
                modifierGroupId = modifier?.groupId || mod.modifierId; // fallback to modifierId if not found
              }

              return {
                tenantId,
                orderItemId: orderItem.id,
                modifierId: mod.modifierId,
                modifierGroupId,
                modifierName: mod.modifierName,
                modifierPrice: mod.price,
                quantity: mod.quantity ?? 1,
              };
            })
          );

          await tx.orderItemModifier.createMany({
            data: modifierData,
          });
        }
      }

      return this.findOne(tenantId, order.id);
    });
  }

  async findAll(tenantId: string, query: OrderQueryDto) {
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (query.orderStatus) {
      where.orderStatus = query.orderStatus;
    }

    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    if (query.orderType) {
      where.orderType = query.orderType;
    }

    if (query.locationId) {
      where.locationId = query.locationId;
    }

    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { displayNumber: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { customerPhone: { contains: query.search, mode: 'insensitive' } },
        { tableNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.createdAt.lte = new Date(query.dateTo);
      }
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              modifiers: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    };
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        orderItems: {
          include: {
            modifiers: true,
            product: {
              select: {
                id: true,
                name: true,
                displayName: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(tenantId: string, id: string, userId: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(tenantId, id);

    const updateData: any = {
      orderStatus: dto.orderStatus,
    };

    if (dto.orderStatus === OrderStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    if (dto.orderStatus === OrderStatus.VOIDED) {
      updateData.voidedAt = new Date();
      updateData.voidReason = dto.voidReason;
      updateData.voidedByUserId = userId;
    }

    if (dto.orderStatus === OrderStatus.PREPARING) {
      updateData.sentToKitchenAt = new Date();
    }

    if (dto.orderStatus === OrderStatus.READY) {
      updateData.kitchenCompletedAt = new Date();
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
    });
  }

  async updatePaymentStatus(tenantId: string, id: string, dto: UpdatePaymentStatusDto) {
    const order = await this.findOne(tenantId, id);

    const updateData: any = {
      paymentStatus: dto.paymentStatus,
    };

    if (dto.amountPaid !== undefined) {
      const newAmountPaid = Number(order.amountPaid) + dto.amountPaid;
      updateData.amountPaid = newAmountPaid;
      updateData.amountDue = Number(order.totalAmount) - newAmountPaid;

      if (newAmountPaid >= Number(order.totalAmount)) {
        updateData.paymentStatus = PaymentStatus.PAID;
      } else if (newAmountPaid > 0) {
        updateData.paymentStatus = PaymentStatus.PARTIAL;
      }
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
    });
  }

  async getStats(tenantId: string, locationId?: string, dateFrom?: string, dateTo?: string) {
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (locationId) {
      where.locationId = locationId;
    }

    // Default to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    where.createdAt = {
      gte: dateFrom ? new Date(dateFrom) : today,
      lt: dateTo ? new Date(dateTo) : tomorrow,
    };

    const [totalOrders, openOrders, completedOrders, totalSales] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ 
        where: { 
          ...where, 
          orderStatus: { in: ['open', 'preparing', 'ready'] } 
        } 
      }),
      this.prisma.order.count({ 
        where: { ...where, orderStatus: 'completed' } 
      }),
      this.prisma.order.aggregate({
        where: { ...where, paymentStatus: 'paid' },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalOrders,
      openOrders,
      completedOrders,
      totalSales: totalSales._sum.totalAmount ?? 0,
    };
  }

  async refund(tenantId: string, id: string, userId: string, amount?: number) {
    const order = await this.findOne(tenantId, id);

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Order must be paid to refund');
    }

    const refundAmount = amount ?? Number(order.totalAmount);

    return this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
        amountPaid: Number(order.amountPaid) - refundAmount,
        amountDue: refundAmount,
        metadata: {
          ...(order.metadata as object || {}),
          refundedAt: new Date().toISOString(),
          refundedByUserId: userId,
          refundAmount,
        },
      },
    });
  }
}
