import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CombosService } from './combos.service';
import { CreateComboFromUIDto, AddComboItemDto, UpdateComboItemDto } from './dto/combo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('combos')
@UseGuards(JwtAuthGuard)
export class CombosController {
  constructor(private readonly combosService: CombosService) {}

  @Post()
  createCombo(@Req() req: any, @Body() dto: CreateComboFromUIDto) {
    const tenantId = req.user.tenantId;
    return this.combosService.createComboFromUI(tenantId, dto);
  }

  @Get()
  getAllCombos(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.combosService.getAllCombos(tenantId);
  }

  @Get(':comboProductId')
  getCombo(@Req() req: any, @Param('comboProductId') comboProductId: string) {
    const tenantId = req.user.tenantId;
    return this.combosService.getCombo(tenantId, comboProductId);
  }

  @Put(':comboId')
  updateCombo(
    @Req() req: any,
    @Param('comboId') comboId: string,
    @Body() dto: CreateComboFromUIDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.combosService.updateComboFromUI(tenantId, comboId, dto);
  }

  @Delete(':comboId')
  deleteCombo(@Req() req: any, @Param('comboId') comboId: string) {
    const tenantId = req.user.tenantId;
    return this.combosService.deleteCombo(tenantId, comboId);
  }

  @Post(':comboProductId/items')
  addComboItem(
    @Req() req: any,
    @Param('comboProductId') comboProductId: string,
    @Body() dto: AddComboItemDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.combosService.addComboItem(tenantId, comboProductId, dto);
  }

  @Put(':comboProductId/items/:itemId')
  updateComboItem(
    @Req() req: any,
    @Param('comboProductId') comboProductId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateComboItemDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.combosService.updateComboItem(tenantId, comboProductId, itemId, dto);
  }

  @Delete(':comboProductId/items/:itemId')
  removeComboItem(
    @Req() req: any,
    @Param('comboProductId') comboProductId: string,
    @Param('itemId') itemId: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.combosService.removeComboItem(tenantId, comboProductId, itemId);
  }

  @Get(':comboProductId/expand')
  expandComboForOrder(
    @Req() req: any,
    @Param('comboProductId') comboProductId: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.combosService.expandComboForOrder(tenantId, comboProductId, 1);
  }
}
