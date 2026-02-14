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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateCategoryDto) {
    const tenantId = req.user.tenantId;
    return this.categoriesService.create(tenantId, dto);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
  ) {
    const tenantId = req.user.tenantId;
    return this.categoriesService.findAll(tenantId, includeInactive);
  }

  @Get('subcategories')
  findSubcategories(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.categoriesService.findSubcategories(tenantId);
  }

  @Get('tree')
  findTree(
    @Req() req: any,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
    @Query('includeProducts', new ParseBoolPipe({ optional: true })) includeProducts?: boolean,
  ) {
    const tenantId = req.user.tenantId;
    return this.categoriesService.findTree(tenantId, includeInactive, includeProducts);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.categoriesService.findOne(tenantId, id);
  }

  @Put(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.categoriesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.categoriesService.remove(tenantId, id);
  }

  @Post('bulk-sort')
  bulkUpdateSortOrder(
    @Req() req: any,
    @Body() updates: Array<{ id: string; sortOrder: number }>,
  ) {
    const tenantId = req.user.tenantId;
    return this.categoriesService.bulkUpdateSortOrder(tenantId, updates);
  }
}
