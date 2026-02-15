import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
  OrderQueryDto,
} from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.ordersService.create(tenantId, userId, dto);
  }

  @Get()
  findAll(@Req() req: any, @Query() query: OrderQueryDto) {
    const tenantId = req.user.tenantId;
    return this.ordersService.findAll(tenantId, query);
  }

  @Get('stats')
  getStats(
    @Req() req: any,
    @Query('locationId') locationId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.ordersService.getStats(tenantId, locationId, dateFrom, dateTo);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.ordersService.findOne(tenantId, id);
  }

  @Put(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.ordersService.updateStatus(tenantId, id, userId, dto);
  }

  @Put(':id/payment')
  updatePayment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.ordersService.updatePaymentStatus(tenantId, id, dto);
  }

  @Post(':id/refund')
  refund(
    @Req() req: any,
    @Param('id') id: string,
    @Body('amount') amount?: number,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.ordersService.refund(tenantId, id, userId, amount);
  }
}
