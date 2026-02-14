import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OwnerService } from './owner.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantQueryDto,
  CreateTenantLocationDto,
  UpdateTenantLocationDto,
  CreateTenantUserDto,
  UpdateTenantUserDto,
  ResetUserPasswordDto,
} from './dto/tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnerGuard } from './guards/owner.guard';

/**
 * Owner Controller - For SaaS platform owner operations
 * All endpoints require owner authentication
 * Route: /api/owner/*
 */
@Controller('owner')
@UseGuards(JwtAuthGuard, OwnerGuard)
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  /**
   * Get dashboard statistics
   * GET /api/owner/dashboard
   */
  @Get('dashboard')
  getDashboardStats() {
    return this.ownerService.getDashboardStats();
  }

  /**
   * Get all tenants with pagination
   * GET /api/owner/tenants?search=&status=&plan=&page=&limit=
   */
  @Get('tenants')
  findAllTenants(@Query() query: TenantQueryDto) {
    return this.ownerService.findAllTenants(query);
  }

  /**
   * Get tenant by ID with full details
   * GET /api/owner/tenants/:id
   */
  @Get('tenants/:id')
  findTenantById(@Param('id') id: string) {
    return this.ownerService.findTenantById(id);
  }

  /**
   * Create a new tenant
   * POST /api/owner/tenants
   */
  @Post('tenants')
  @HttpCode(HttpStatus.CREATED)
  createTenant(@Body() dto: CreateTenantDto) {
    return this.ownerService.createTenant(dto);
  }

  /**
   * Update tenant details
   * PUT /api/owner/tenants/:id
   */
  @Put('tenants/:id')
  updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.ownerService.updateTenant(id, dto);
  }

  /**
   * Suspend a tenant
   * POST /api/owner/tenants/:id/suspend
   */
  @Post('tenants/:id/suspend')
  @HttpCode(HttpStatus.OK)
  suspendTenant(@Param('id') id: string, @Body('reason') reason: string) {
    return this.ownerService.suspendTenant(id, reason);
  }

  /**
   * Activate/reactivate a tenant
   * POST /api/owner/tenants/:id/activate
   */
  @Post('tenants/:id/activate')
  @HttpCode(HttpStatus.OK)
  activateTenant(@Param('id') id: string) {
    return this.ownerService.activateTenant(id);
  }

  /**
   * Delete a tenant (soft delete)
   * DELETE /api/owner/tenants/:id
   */
  @Delete('tenants/:id')
  @HttpCode(HttpStatus.OK)
  deleteTenant(@Param('id') id: string) {
    return this.ownerService.deleteTenant(id);
  }

  // ==========================================
  // TENANT LOCATION MANAGEMENT
  // ==========================================

  /**
   * Get all locations for a tenant
   * GET /api/owner/tenants/:id/locations
   */
  @Get('tenants/:id/locations')
  getTenantLocations(@Param('id') id: string) {
    return this.ownerService.getTenantLocations(id);
  }

  /**
   * Add a location to a tenant
   * POST /api/owner/tenants/:id/locations
   */
  @Post('tenants/:id/locations')
  @HttpCode(HttpStatus.CREATED)
  addLocationToTenant(
    @Param('id') tenantId: string,
    @Body() dto: CreateTenantLocationDto,
  ) {
    return this.ownerService.addLocationToTenant(tenantId, dto);
  }

  /**
   * Update a location for a tenant
   * PATCH /api/owner/tenants/:tenantId/locations/:locationId
   */
  @Patch('tenants/:tenantId/locations/:locationId')
  updateTenantLocation(
    @Param('tenantId') tenantId: string,
    @Param('locationId') locationId: string,
    @Body() dto: UpdateTenantLocationDto,
  ) {
    return this.ownerService.updateTenantLocation(tenantId, locationId, dto);
  }

  /**
   * Delete a location for a tenant
   * DELETE /api/owner/tenants/:tenantId/locations/:locationId
   */
  @Delete('tenants/:tenantId/locations/:locationId')
  @HttpCode(HttpStatus.OK)
  deleteTenantLocation(
    @Param('tenantId') tenantId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.ownerService.deleteTenantLocation(tenantId, locationId);
  }

  // ==========================================
  // TENANT USER MANAGEMENT
  // ==========================================

  /**
   * Get all users for a tenant
   * GET /api/owner/tenants/:id/users
   */
  @Get('tenants/:id/users')
  getTenantUsers(@Param('id') id: string) {
    return this.ownerService.getTenantUsers(id);
  }

  /**
   * Add a user to a tenant
   * POST /api/owner/tenants/:id/users
   */
  @Post('tenants/:id/users')
  @HttpCode(HttpStatus.CREATED)
  addUserToTenant(
    @Param('id') tenantId: string,
    @Body() dto: CreateTenantUserDto,
  ) {
    return this.ownerService.addUserToTenant(tenantId, dto);
  }

  /**
   * Update a user for a tenant
   * PATCH /api/owner/tenants/:tenantId/users/:userId
   */
  @Patch('tenants/:tenantId/users/:userId')
  updateTenantUser(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateTenantUserDto,
  ) {
    return this.ownerService.updateTenantUser(tenantId, userId, dto);
  }

  /**
   * Reset password for a tenant user
   * POST /api/owner/tenants/:tenantId/users/:userId/reset-password
   */
  @Post('tenants/:tenantId/users/:userId/reset-password')
  @HttpCode(HttpStatus.OK)
  resetTenantUserPassword(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() dto: ResetUserPasswordDto,
  ) {
    return this.ownerService.resetTenantUserPassword(tenantId, userId, dto);
  }

  /**
   * Delete a user from a tenant
   * DELETE /api/owner/tenants/:tenantId/users/:userId
   */
  @Delete('tenants/:tenantId/users/:userId')
  @HttpCode(HttpStatus.OK)
  deleteTenantUser(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    return this.ownerService.deleteTenantUser(tenantId, userId);
  }
}
