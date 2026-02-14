import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseBoolPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateLocationPriceDto,
  ProductAvailabilityDto,
} from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    const tenantId = req.user.tenantId;
    return this.productsService.create(tenantId, dto);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('categoryId') categoryId?: string,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.productsService.findAll(tenantId, {
      categoryId,
      includeInactive,
      type,
      search,
    });
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.productsService.findOne(tenantId, id);
  }

  @Put(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.productsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.productsService.remove(tenantId, id);
  }

  // Location Pricing
  @Post(':id/location-prices')
  setLocationPrice(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateLocationPriceDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.productsService.setLocationPrice(tenantId, id, dto);
  }

  @Get(':id/price')
  getPrice(
    @Req() req: any,
    @Param('id') id: string,
    @Query('locationId') locationId?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.productsService.getProductPrice(tenantId, id, locationId);
  }

  @Delete(':id/location-prices/:locationId')
  removeLocationPrice(
    @Req() req: any,
    @Param('id') id: string,
    @Param('locationId') locationId: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.productsService.removeLocationPrice(tenantId, id, locationId);
  }

  // Availability
  @Put(':id/availability')
  setAvailability(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ProductAvailabilityDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.productsService.setAvailability(tenantId, id, dto);
  }

  // Stock Management
  @Post(':id/stock')
  updateStock(
    @Req() req: any,
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    const tenantId = req.user.tenantId;
    return this.productsService.updateStock(tenantId, id, quantity);
  }
}
