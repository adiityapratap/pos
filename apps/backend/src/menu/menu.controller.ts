import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('menu')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * Get full POS menu (optimized for POS terminals)
   * Use this endpoint for initial load and menu refreshes
   */
  @Get('pos')
  getPOSMenu(
    @Req() req: any,
    @Query('locationId') locationId?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.menuService.getPOSMenu(tenantId, locationId);
  }

  /**
   * Get flat products list (for search functionality)
   */
  @Get('products-list')
  getProductsList(
    @Req() req: any,
    @Query('locationId') locationId?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.menuService.getProductsList(tenantId, locationId);
  }

  /**
   * Check if menu has been updated since a version
   * Used for cache invalidation
   */
  @Get('check-updates')
  checkUpdates(
    @Req() req: any,
    @Query('version') version: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.menuService.hasMenuUpdated(tenantId, version);
  }
}
