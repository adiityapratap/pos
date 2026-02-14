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
import { ModifiersService } from './modifiers.service';
import {
  CreateModifierGroupDto,
  UpdateModifierGroupDto,
  CreateModifierDto,
  UpdateModifierDto,
  LinkModifierGroupDto,
  UpdateProductModifierGroupDto,
} from './dto/modifier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('modifiers')
@UseGuards(JwtAuthGuard)
export class ModifiersController {
  constructor(private readonly modifiersService: ModifiersService) {}

  // ========== MODIFIER GROUPS ==========
  @Post('groups')
  createGroup(@Req() req: any, @Body() dto: CreateModifierGroupDto) {
    const tenantId = req.user.tenantId;
    return this.modifiersService.createGroup(tenantId, dto);
  }

  @Get('groups')
  findAllGroups(
    @Req() req: any,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
  ) {
    const tenantId = req.user.tenantId;
    return this.modifiersService.findAllGroups(tenantId, includeInactive);
  }

  @Get('groups/:id')
  findOneGroup(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.modifiersService.findOneGroup(tenantId, id);
  }

  @Put('groups/:id')
  updateGroup(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateModifierGroupDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.modifiersService.updateGroup(tenantId, id, dto);
  }

  @Delete('groups/:id')
  removeGroup(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.modifiersService.removeGroup(tenantId, id);
  }

  // ========== MODIFIERS ==========
  @Post()
  createModifier(@Req() req: any, @Body() dto: CreateModifierDto) {
    const tenantId = req.user.tenantId;
    return this.modifiersService.createModifier(tenantId, dto);
  }

  @Get()
  findAllModifiers(
    @Req() req: any,
    @Query('groupId') groupId?: string,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
  ) {
    const tenantId = req.user.tenantId;
    return this.modifiersService.findAllModifiers(tenantId, groupId, includeInactive);
  }

  @Get(':id')
  findOneModifier(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.modifiersService.findOneModifier(tenantId, id);
  }

  @Put(':id')
  updateModifier(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateModifierDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.modifiersService.updateModifier(tenantId, id, dto);
  }

  @Delete(':id')
  removeModifier(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.modifiersService.removeModifier(tenantId, id);
  }

  // ========== PRODUCT MODIFIER GROUP MAPPING ==========
  @Post('products/:productId/groups')
  linkGroupToProduct(
    @Req() req: any,
    @Param('productId') productId: string,
    @Body() dto: LinkModifierGroupDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.modifiersService.linkGroupToProduct(tenantId, productId, dto);
  }

  @Get('products/:productId/groups')
  getProductModifierGroups(
    @Req() req: any,
    @Param('productId') productId: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.modifiersService.getProductModifierGroups(tenantId, productId);
  }

  @Put('products/:productId/groups/:groupId')
  updateProductModifierGroup(
    @Req() req: any,
    @Param('productId') productId: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateProductModifierGroupDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.modifiersService.updateProductModifierGroup(
      tenantId,
      productId,
      groupId,
      dto,
    );
  }

  @Delete('products/:productId/groups/:groupId')
  unlinkGroupFromProduct(
    @Req() req: any,
    @Param('productId') productId: string,
    @Param('groupId') groupId: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.modifiersService.unlinkGroupFromProduct(tenantId, productId, groupId);
  }
}
