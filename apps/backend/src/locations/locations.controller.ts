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
import { LocationsService } from './locations.service';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Locations Controller - For tenant location management
 * Route: /api/locations
 */
@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /**
   * Get all locations for the tenant
   * GET /api/locations
   */
  @Get()
  findAll(
    @Req() req: any,
    @Query('includeInactive', new ParseBoolPipe({ optional: true }))
    includeInactive?: boolean,
  ) {
    const tenantId = req.user.tenantId;
    return this.locationsService.findAll(tenantId, includeInactive);
  }

  /**
   * Get location by ID
   * GET /api/locations/:id
   */
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.locationsService.findOne(tenantId, id);
  }

  /**
   * Create a new location
   * POST /api/locations
   */
  @Post()
  create(@Req() req: any, @Body() dto: CreateLocationDto) {
    const tenantId = req.user.tenantId;
    return this.locationsService.create(tenantId, dto);
  }

  /**
   * Update location
   * PUT /api/locations/:id
   */
  @Put(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.locationsService.update(tenantId, id, dto);
  }

  /**
   * Delete location (soft delete)
   * DELETE /api/locations/:id
   */
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.locationsService.remove(tenantId, id);
  }
}
